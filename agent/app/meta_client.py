import json
import requests
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

logger = logging.getLogger(__name__)

class MetaAPIClient:
    """Client for interacting with Meta's Marketing API"""
    
    def __init__(self, config_path: str = "config/meta_config.json"):
        self.config = self._load_config(config_path)
        self.base_url = self.config["meta_api"]["base_url"]
        self.access_token = self.config["meta_api"]["access_token"]
        self.ad_account_id = self.config["meta_api"]["ad_account_id"]
        self.app_id = self.config["meta_api"]["app_id"]
        self.timeout = self.config["meta_api"]["timeout"]
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            config_file = Path(config_path)
            if not config_file.exists():
                raise FileNotFoundError(f"Config file not found: {config_path}")
            
            with open(config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            raise
    
    def _make_request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a request to Meta's API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=self.timeout)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=self.timeout)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=self.timeout)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise
    
    def get_app_info(self) -> Dict[str, Any]:
        """Get information about the Meta app"""
        endpoint = f"{self.app_id}"
        params = {"fields": "id,name"}
        # params = {"fields": "id,name,category,link,privacy_policy_url,terms_of_service_url"}
        response = self._make_request(f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        return response
    
    def get_ad_account_info(self) -> Dict[str, Any]:
        """Get information about the ad account"""
        endpoint = f"act_{self.ad_account_id}"
        params = {"fields": "id,account_id,currency,account_status,timezone_name"}
        response = self._make_request(f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        return response
    
    def get_campaigns(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Get campaigns from the ad account"""
        endpoint = f"act_{self.ad_account_id}/campaigns"
        params = {"limit": limit, "fields": "id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget"}
        response = self._make_request(f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        return response.get("data", [])
    
    def get_insights(self, date_preset: str = "today") -> Dict[str, Any]:
        """Get insights/metrics for the ad account"""
        endpoint = f"act_{self.ad_account_id}/insights"
        params = {
            "date_preset": date_preset,
            "fields": "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency"
        }
        response = self._make_request(f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        return response.get("data", [{}])[0] if response.get("data") else {}
    
    def get_ad_sets(self, campaign_id: str, limit: int = 25) -> List[Dict[str, Any]]:
        """Get ad sets for a specific campaign"""
        endpoint = f"{campaign_id}/adsets"
        params = {
            "limit": limit, 
            "fields": "id,name,status,effective_status,daily_budget,lifetime_budget,optimization_goal,created_time,updated_time"
        }
        response = self._make_request(f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        return response.get("data", [])
    
    def get_ads(self, ad_set_id: str, limit: int = 25) -> List[Dict[str, Any]]:
        """Get ads for a specific ad set"""
        endpoint = f"{ad_set_id}/ads"
        params = {
            "limit": limit,
            "fields": "id,name,status,effective_status,creative,created_time,updated_time"
        }
        response = self._make_request(f"{endpoint}?{'&'.join([f'{k}={v}' for k, v in params.items()])}")
        return response.get("data", [])
    
    def create_campaign(self, name: str, objective: str, status: str = "PAUSED") -> Dict[str, Any]:
        """Create a new campaign"""
        endpoint = f"act_{self.ad_account_id}/campaigns"
        data = {
            "name": name,
            "objective": objective,
            "status": status
        }
        return self._make_request(endpoint, method="POST", data=data)
    
    def get_campaigns_detailed(self, limit: int = 25) -> List[Dict[str, Any]]:
        """Get campaigns with detailed ad sets and ads"""
        campaigns = self.get_campaigns(limit)
        
        for campaign in campaigns:
            try:
                # Get ad sets for this campaign
                ad_sets = self.get_ad_sets(campaign["id"], limit=50)
                campaign["ad_sets"] = ad_sets
                
                # Get ads for each ad set
                for ad_set in ad_sets:
                    try:
                        ads = self.get_ads(ad_set["id"], limit=50)
                        ad_set["ads"] = ads
                    except Exception as e:
                        logger.warning(f"Failed to get ads for ad set {ad_set.get('id')}: {e}")
                        ad_set["ads"] = []
                        
            except Exception as e:
                logger.warning(f"Failed to get ad sets for campaign {campaign.get('id')}: {e}")
                campaign["ad_sets"] = []
        
        return campaigns

    def test_connection(self) -> bool:
        """Test the connection to Meta's API"""
        try:
            self.get_ad_account_info()
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False
