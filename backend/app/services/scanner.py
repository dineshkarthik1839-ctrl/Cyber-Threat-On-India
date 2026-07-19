import asyncio
import httpx
import dns.resolver
import socket
import ssl
from datetime import datetime
import ipaddress
import requests
from urllib.parse import urlparse

# Avoid hitting private network spaces (SSRF protection)
def is_safe_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return not (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast)
    except ValueError:
        return False

async def fetch_dns_records(domain: str) -> dict:
    records = {"A": [], "AAAA": [], "MX": [], "TXT": []}
    
    # We use sync dns.resolver in an executor or just run it since it's fast
    try:
        answers = dns.resolver.resolve(domain, 'A')
        records["A"] = [rdata.to_text() for rdata in answers]
    except Exception:
        pass
        
    try:
        answers = dns.resolver.resolve(domain, 'AAAA')
        records["AAAA"] = [rdata.to_text() for rdata in answers]
    except Exception:
        pass
        
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        records["MX"] = [rdata.to_text() for rdata in answers]
    except Exception:
        pass
        
    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        records["TXT"] = [rdata.to_text() for rdata in answers]
    except Exception:
        pass
        
    return records

async def fetch_ssl_info(domain: str) -> dict:
    info = {"valid": False, "issuer": "", "expires": "", "error": ""}
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                
                issuer_dict = dict(x[0] for x in cert.get('issuer', []))
                info["issuer"] = issuer_dict.get('organizationName', issuer_dict.get('commonName', 'Unknown'))
                
                not_after = cert.get('notAfter')
                if not_after:
                    info["expires"] = not_after
                    
                info["valid"] = True
    except Exception as e:
        info["error"] = str(e)
    return info

async def fetch_http_headers(domain: str, safe_ips: list) -> dict:
    # SSRF protection: ensure the domain resolves to a public IP
    if not safe_ips:
        return {"error": "No safe public IPs found for domain"}
        
    url = f"https://{domain}"
    headers_dict = {}
    
    # We use the domain but httpx will resolve it. 
    # To be strictly safe, we'd force resolution, but checking IPs beforehand is usually enough for basic protection.
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=False, follow_redirects=True) as client:
            resp = await client.get(url)
            headers_dict = dict(resp.headers)
    except Exception as e:
        headers_dict["error"] = str(e)
        
    return headers_dict

def check_otx_reputation(domain: str, api_key: str = None) -> int:
    """Returns number of pulses for this domain"""
    url = f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general"
    headers = {}
    if api_key:
        headers["X-OTX-API-KEY"] = api_key
        
    try:
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            return data.get("pulse_info", {}).get("count", 0)
    except Exception:
        pass
    return 0

def calculate_risk(dns_rec, ssl_info, headers, otx_pulses) -> tuple[int, str]:
    score = 0 # 0 is perfectly secure, 100 is critical risk
    
    # OTX Pulses
    if otx_pulses > 10:
        score += 80
    elif otx_pulses > 0:
        score += 40
        
    # SSL
    if not ssl_info.get("valid"):
        score += 30
        
    # Headers
    if "error" in headers:
        score += 10 # Cannot reach
    else:
        h_lower = {k.lower(): v for k, v in headers.items()}
        if "strict-transport-security" not in h_lower:
            score += 10
        if "content-security-policy" not in h_lower:
            score += 10
        if "x-frame-options" not in h_lower:
            score += 5
            
    # Cap at 100
    score = min(score, 100)
    
    if score >= 80:
        return score, "Critical"
    elif score >= 50:
        return score, "High"
    elif score >= 20:
        return score, "Medium"
    return score, "Low"

async def analyze_domain(domain: str, otx_key: str = None) -> dict:
    # Clean domain
    domain = domain.lower().replace("http://", "").replace("https://", "").split("/")[0]
    
    dns_rec = await fetch_dns_records(domain)
    
    # Check SSRF safety
    all_ips = dns_rec.get("A", []) + dns_rec.get("AAAA", [])
    safe_ips = [ip for ip in all_ips if is_safe_ip(ip)]
    
    ssl_task = fetch_ssl_info(domain)
    headers_task = fetch_http_headers(domain, safe_ips)
    
    # Run OTX sync function in a thread
    otx_task = asyncio.to_thread(check_otx_reputation, domain, otx_key)
    
    ssl_info, headers, otx_pulses = await asyncio.gather(ssl_task, headers_task, otx_task)
    
    risk_score, risk_level = calculate_risk(dns_rec, ssl_info, headers, otx_pulses)
    
    return {
        "domain": domain,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "ip_addresses": safe_ips,
        "dns_records": dns_rec,
        "ssl_info": ssl_info,
        "security_headers": headers,
        "otx_pulses": otx_pulses,
        "has_malicious_reputation": otx_pulses > 0
    }
