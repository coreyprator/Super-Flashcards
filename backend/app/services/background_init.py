# backend/app/services/background_init.py
"""
Background initialization manager for OpenAI services
Starts initialization of slow services in background threads after server startup
"""
import logging
import asyncio
from typing import List

logger = logging.getLogger(__name__)

class BackgroundInitManager:
    """
    Manager for background initialization of services
    """
    
    def __init__(self):
        self.initialized_services: List[str] = []
        self.failed_services: List[str] = []
    
    async def start_background_initialization(self):
        """
        Start background initialization of all OpenAI-dependent services
        """
        logger.info("🚀 Starting background initialization of OpenAI services...")
        
        # Import service registry here to avoid circular imports
        try:
            from app.services.service_registry import service_registry
            
            # Get singleton service instances
            audio_service = service_registry.audio_service
            ipa_service = service_registry.ipa_service
            
            # Start background initialization
            logger.info("🔄 Initiating AudioService background initialization...")
            audio_service.start_background_initialization()
            
            logger.info("🔄 Initiating IPAService background initialization...")
            ipa_service.start_background_initialization()
            
            # Optional: Monitor initialization progress
            await self._monitor_initialization_progress(
                [("AudioService", audio_service), ("IPAService", ipa_service)]
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to start background initialization: {e}")
    
    async def _monitor_initialization_progress(self, services):
        """
        Monitor the progress of background initialization
        """
        max_wait_time = 180  # 3 minutes max wait
        check_interval = 5   # Check every 5 seconds
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            all_ready = True
            status_messages = []
            
            for service_name, service in services:
                if hasattr(service, 'is_ready') and service.is_ready():
                    if service_name not in self.initialized_services:
                        self.initialized_services.append(service_name)
                        logger.info(f"✅ {service_name} initialization complete!")
                    status_messages.append(f"{service_name}: ✅ Ready")
                else:
                    all_ready = False
                    status_messages.append(f"{service_name}: 🔄 Initializing...")
            
            if all_ready:
                logger.info("🎉 All OpenAI services ready!")
                break
                
            if elapsed_time % 30 == 0:  # Log progress every 30 seconds
                logger.info(f"📊 Background initialization progress: {', '.join(status_messages)}")
            
            await asyncio.sleep(check_interval)
            elapsed_time += check_interval
        
        # Final status report
        if elapsed_time >= max_wait_time:
            logger.warning("⏰ Background initialization timeout reached. Some services may not be ready.")
            for service_name, service in services:
                if not (hasattr(service, 'is_ready') and service.is_ready()):
                    self.failed_services.append(service_name)
                    logger.warning(f"⚠️ {service_name} initialization may have failed or is still in progress")

# Global instance
background_init_manager = BackgroundInitManager()