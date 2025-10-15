# backend/app/services/service_registry.py
"""
Service registry for singleton instances of services
Ensures the same service instances are used across the application
"""
import logging
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.audio_service import AudioService
    from app.services.ipa_service import IPAService

logger = logging.getLogger(__name__)

class ServiceRegistry:
    """
    Registry for singleton service instances
    """
    
    def __init__(self):
        self._audio_service: Optional['AudioService'] = None
        self._ipa_service: Optional['IPAService'] = None
    
    @property
    def audio_service(self):
        """Get or create AudioService singleton"""
        if self._audio_service is None:
            from app.services.audio_service import AudioService
            self._audio_service = AudioService()
            logger.info("📦 AudioService singleton created")
        return self._audio_service
    
    @property
    def ipa_service(self):
        """Get or create IPAService singleton"""
        if self._ipa_service is None:
            from app.services.ipa_service import IPAService
            self._ipa_service = IPAService()
            logger.info("📦 IPAService singleton created")
        return self._ipa_service
    
    def get_service_status(self) -> dict:
        """Get the status of all services"""
        status = {}
        
        if self._audio_service:
            status['audio_service'] = {
                'created': True,
                'ready': self._audio_service.is_ready() if hasattr(self._audio_service, 'is_ready') else False
            }
        else:
            status['audio_service'] = {'created': False, 'ready': False}
            
        if self._ipa_service:
            status['ipa_service'] = {
                'created': True,
                'ready': self._ipa_service.is_ready() if hasattr(self._ipa_service, 'is_ready') else False
            }
        else:
            status['ipa_service'] = {'created': False, 'ready': False}
            
        return status

# Global singleton registry
service_registry = ServiceRegistry()