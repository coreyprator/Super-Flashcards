# backend/app/routers/efg_native.py
# BUG-070: SF-native EFG graph endpoint.
# Connects to EtymologyGraph DB via efg_user / efg-db-password (same SQL Server).
# Replaces cross-origin calls to the external EFG service for the EFG Panel.
# Column names per all_db_schemas.json:
#   nodes: id, label, language, node_type, gloss, pie_root, pie_root_id, source
#   edges: id, source_node, target_node, edge_type, grimm_label, weight, created_at
import logging
import os
import pyodbc
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/efg", tags=["efg-native"])

_efg_password_cache = None


def _get_efg_password():
    """Get EFG DB password from env var or Secret Manager (mirrors efg.py pattern)."""
    global _efg_password_cache
    if _efg_password_cache:
        return _efg_password_cache
    password = os.getenv("EFG_DB_PASSWORD", "")
    if password:
        _efg_password_cache = password
        return password
    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        name = "projects/super-flashcards-475210/secrets/efg-db-password/versions/latest"
        response = client.access_secret_version(request={"name": name})
        password = response.payload.data.decode("UTF-8").strip()
        _efg_password_cache = password
        return password
    except Exception as exc:
        logger.error("[efg_native] failed to fetch EFG DB password: %s", exc)
        return ""


def _get_efg_connection():
    """Open a pyodbc connection to EtymologyGraph DB using efg_user credentials."""
    password = _get_efg_password()
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;"
        "DATABASE=EtymologyGraph;"
        "UID=efg_user;"
        f"PWD={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


@router.get("/graph")
def get_efg_graph(
    node: str = Query(..., min_length=1, max_length=200),
):
    """
    BUG-070: Return filtered subgraph for a given node ID.
    Connects directly to EtymologyGraph DB via efg_user.
    Bail-out: returns 200 with truncated flag if >100 rows (fan-out guard).
    """
    try:
        conn = _get_efg_connection()
        cursor = conn.cursor()
    except Exception as exc:
        logger.error("[efg_native] DB connection failed: %s", exc)
        raise HTTPException(status_code=500, detail="EFG graph query failed")

    try:
        # Query 1: central node + its edges (parameterized — no f-string user input)
        cursor.execute(
            """
            SELECT n.id, n.label, n.node_type, n.gloss,
                   e.id AS edge_id, e.source_node, e.target_node, e.edge_type
            FROM nodes n
            LEFT JOIN edges e ON e.source_node = n.id OR e.target_node = n.id
            WHERE n.id = ?
            """,
            (node,)
        )
        rows = cursor.fetchall()
    except Exception as exc:
        logger.error("[efg_native] central query failed: %s", exc)
        conn.close()
        raise HTTPException(status_code=500, detail="EFG graph query failed")

    if not rows:
        conn.close()
        return {"node_id": node, "nodes": [], "edges": [], "truncated": False}

    # Bail-out throttle per R2BREV6 spec
    truncated = len(rows) > 100
    if truncated:
        logger.warning("[efg_native] node %s returned %d rows — truncating to 100", node, len(rows))
        rows = rows[:100]

    # Extract central node info from first row
    first = rows[0]
    central_node = {
        "id": str(first.id),
        "label": first.label or str(first.id),
        "node_type": first.node_type or "node",
        "gloss": first.gloss,
    }

    # Collect edges (rows where edge_id is not None)
    edges = []
    neighbor_ids: set = set()
    for row in rows:
        if row.edge_id is not None:
            edges.append({
                "id": str(row.edge_id),
                "source_id": str(row.source_node) if row.source_node is not None else None,
                "target_id": str(row.target_node) if row.target_node is not None else None,
                "relation": row.edge_type,
            })
            if row.source_node is not None and str(row.source_node) != str(node):
                neighbor_ids.add(str(row.source_node))
            if row.target_node is not None and str(row.target_node) != str(node):
                neighbor_ids.add(str(row.target_node))

    # Query 2: fetch neighbor node details (parameterized with ? placeholders)
    neighbor_nodes = []
    if neighbor_ids:
        id_list = list(neighbor_ids)
        placeholders = ", ".join("?" for _ in id_list)
        try:
            cursor.execute(
                f"SELECT id, label, node_type, gloss FROM nodes WHERE id IN ({placeholders})",
                id_list
            )
            for r in cursor.fetchall():
                neighbor_nodes.append({
                    "id": str(r.id),
                    "label": r.label or str(r.id),
                    "node_type": r.node_type or "node",
                    "gloss": r.gloss,
                })
        except Exception as exc:
            logger.warning("[efg_native] neighbor query failed (non-fatal): %s", exc)
            for nid in id_list:
                neighbor_nodes.append({"id": nid, "label": nid, "node_type": "node", "gloss": None})

    conn.close()
    all_nodes = [central_node] + neighbor_nodes

    return {
        "node_id": node,
        "nodes": all_nodes,
        "edges": edges,
        "truncated": truncated,
    }
