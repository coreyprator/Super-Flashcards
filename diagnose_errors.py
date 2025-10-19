"""
Cloud Run Error Diagnostics Script
Systematically review and analyze errors from Google Cloud Run logs
"""
import subprocess
import json
import sys
from datetime import datetime
from collections import defaultdict

def run_gcloud_command(cmd):
    """Run a gcloud command and return the output"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            shell=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e.stderr}")
        return None

def get_latest_revision():
    """Get the latest Cloud Run revision name"""
    cmd = 'gcloud run revisions list --service=super-flashcards --region=us-central1 --limit=1 --format="value(name)" --project=super-flashcards-475210'
    output = run_gcloud_command(cmd)
    if output:
        return output.strip()
    return None

def get_error_logs(revision_name=None, limit=50):
    """Get error logs from Cloud Run"""
    if revision_name:
        filter_clause = f'resource.labels.revision_name={revision_name} AND severity>=ERROR'
    else:
        filter_clause = 'resource.type=cloud_run_revision AND resource.labels.service_name=super-flashcards AND severity>=ERROR'
    
    cmd = f'gcloud logging read "{filter_clause}" --limit {limit} --format json --project=super-flashcards-475210'
    output = run_gcloud_command(cmd)
    
    if not output:
        return []
    
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        print("❌ Failed to parse logs as JSON")
        return []

def analyze_errors(logs):
    """Analyze error logs and categorize them"""
    
    error_types = defaultdict(list)
    http_errors = defaultdict(int)
    
    for log in logs:
        timestamp = log.get('timestamp', '')
        
        # HTTP errors
        if 'httpRequest' in log:
            status = log['httpRequest'].get('status', 0)
            if status >= 400:
                http_errors[status] += 1
                error_types[f'HTTP {status}'].append({
                    'timestamp': timestamp,
                    'url': log['httpRequest'].get('requestUrl', ''),
                    'method': log['httpRequest'].get('requestMethod', ''),
                    'latency': log['httpRequest'].get('latency', '')
                })
        
        # Python exceptions in textPayload
        text = log.get('textPayload', '')
        if 'Error' in text or 'Exception' in text or 'Traceback' in text:
            # Try to extract error type
            lines = text.split('\n')
            error_line = None
            for line in reversed(lines):
                if 'Error:' in line or 'Exception:' in line:
                    error_line = line.strip()
                    break
            
            if error_line:
                error_type = error_line.split(':')[0].strip()
                error_types[error_type].append({
                    'timestamp': timestamp,
                    'message': error_line,
                    'full_text': text[:500]  # First 500 chars
                })
    
    return error_types, http_errors

def print_diagnostics(revision_name, error_types, http_errors):
    """Print diagnostic report"""
    
    print("\n" + "="*80)
    print(f"🔍 CLOUD RUN ERROR DIAGNOSTICS")
    print("="*80)
    print(f"Revision: {revision_name}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    # HTTP Errors Summary
    print("📊 HTTP ERROR SUMMARY")
    print("-" * 80)
    if http_errors:
        for status, count in sorted(http_errors.items()):
            print(f"  HTTP {status}: {count} occurrences")
    else:
        print("  ✓ No HTTP errors found")
    print()
    
    # Error Types
    print("🐛 ERROR TYPES BREAKDOWN")
    print("-" * 80)
    if error_types:
        for error_type, occurrences in sorted(error_types.items(), key=lambda x: len(x[1]), reverse=True):
            print(f"\n  {error_type}: {len(occurrences)} occurrences")
            print(f"  {'-' * 76}")
            
            # Show latest 3 occurrences
            for i, err in enumerate(occurrences[:3], 1):
                print(f"    #{i} at {err.get('timestamp', 'N/A')}")
                if 'url' in err:
                    print(f"       URL: {err['url']}")
                    print(f"       Method: {err['method']}")
                if 'message' in err:
                    print(f"       Message: {err['message']}")
                if 'full_text' in err:
                    # Show first few lines of traceback
                    lines = err['full_text'].split('\n')[:5]
                    for line in lines:
                        if line.strip():
                            print(f"       {line}")
                print()
    else:
        print("  ✓ No Python errors/exceptions found")
    
    print("\n" + "="*80)
    print("💡 RECOMMENDATIONS")
    print("="*80)
    
    if 'HTTP 500' in error_types or 500 in http_errors:
        print("  • Add ?verbose=true to AI generation requests for detailed logging")
        print("  • Check OpenAI API key is properly set in environment variables")
        print("  • Verify database tables exist (users, user_languages)")
    
    if 'ProgrammingError' in str(error_types):
        print("  • Database table is missing - check schema")
        print("  • Run database migration scripts")
    
    print("\n" + "="*80 + "\n")

def main():
    print("🚀 Starting Cloud Run Error Diagnostics...")
    
    # Get latest revision
    print("\n📍 Finding latest revision...")
    revision = get_latest_revision()
    if not revision:
        print("❌ Could not find latest revision")
        sys.exit(1)
    
    print(f"✓ Latest revision: {revision}")
    
    # Get error logs
    print(f"\n📥 Fetching error logs (limit: 50)...")
    logs = get_error_logs(revision, limit=50)
    
    if not logs:
        print("✓ No errors found!")
        return
    
    print(f"✓ Found {len(logs)} log entries")
    
    # Analyze
    print("\n🔬 Analyzing errors...")
    error_types, http_errors = analyze_errors(logs)
    
    # Print report
    print_diagnostics(revision, error_types, http_errors)
    
    # Save to file
    report_file = f"error_diagnostics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    print(f"💾 Full logs saved to: {report_file}")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(json.dumps({
            'revision': revision,
            'timestamp': datetime.now().isoformat(),
            'error_types': {k: v for k, v in error_types.items()},
            'http_errors': dict(http_errors),
            'raw_logs': logs
        }, indent=2))

if __name__ == "__main__":
    main()
