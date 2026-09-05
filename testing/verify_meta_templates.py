import os
import sys
import json
import time
import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Meta Credentials (Academy Of Tech Masters WABA Account)
WABA_ID = "1026026910332703"
PHONE_ID = "1340972425758369"
ACCESS_TOKEN = "EAARKMMGqXuUBSbXwBAtdjoz4qv7JJWpsVhzpZABXJokhbZCIoJpqhre0ZCiQj5aFAuzZBa5BmnG1twOdZCI7kVO4YQAgcrTI0rIqvtqQL8w4fk3K7yp5mwKQ4OPIGJ65Q1rZAffI2R8bHitwTpeJB61sGlTm9WvKBoFNzjQolbCgEHyUhKH6Radr8ZBRZCZB1qsZC3ZCgZDZD"
GRAPH_VERSION = "v19.0"

HEADERS = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def get_all_meta_templates():
    """Fetch all message templates directly from Meta Cloud API including PENDING and REJECTED statuses."""
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/{WABA_ID}/message_templates"
    params = {
        "limit": 100,
        "fields": "id,name,status,category,language,components"
    }
    
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Fetching templates from Meta API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Meta API Response: {e.response.text}")
        return []

def verify_template_on_meta(template_name):
    """Verify if a specific template exists on Meta Account live."""
    print(f"\n[SEARCH] Searching Meta Account ({WABA_ID}) for template: '{template_name}'...")
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/{WABA_ID}/message_templates"
    params = {
        "name": template_name,
        "fields": "id,name,status,category,language,components"
    }
    
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=15)
        response.raise_for_status()
        data = response.json().get("data", [])
        
        if data:
            tmpl = data[0]
            print(f"[OK] TEMPLATE FOUND ON META ACCOUNT!")
            print(f"   • Meta ID:   {tmpl.get('id')}")
            print(f"   • Name:      {tmpl.get('name')}")
            print(f"   • Status:    {tmpl.get('status')}")
            print(f"   • Category:  {tmpl.get('category')}")
            print(f"   • Language:  {tmpl.get('language')}")
            print(f"   • Components: {len(tmpl.get('components', []))} component(s)")
            return tmpl
        else:
            print(f"[WARN] Template '{template_name}' not found on Meta Account.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Verification Request Failed: {e}")
        return None

def upload_image_for_meta_header(image_file_path):
    """Upload a local image to Meta to get a header_handle for template creation."""
    if not os.path.exists(image_file_path):
        print(f"[ERROR] File not found: {image_file_path}")
        return None

    file_size = os.path.getsize(image_file_path)
    mime_type = "image/png" if image_file_path.endswith(".png") else "image/jpeg"
    
    print(f"[UPLOAD] Creating Meta upload session for image ({file_size} bytes)...")
    session_url = f"https://graph.facebook.com/{GRAPH_VERSION}/app/uploads"
    session_params = {
        "file_length": file_size,
        "file_type": mime_type
    }
    
    try:
        session_res = requests.post(session_url, headers=HEADERS, params=session_params, timeout=15)
        session_res.raise_for_status()
        session_id = session_res.json().get("id")
        
        if not session_id:
            print("[ERROR] Failed to retrieve Meta upload session ID.")
            return None
            
        print(f"   Session ID: {session_id}")
        
        upload_url = f"https://graph.facebook.com/{GRAPH_VERSION}/{session_id}"
        upload_headers = {
            "Authorization": f"OAuth {ACCESS_TOKEN}",
            "file_offset": "0"
        }
        
        with open(image_file_path, "rb") as f:
            upload_res = requests.post(upload_url, headers=upload_headers, data=f, timeout=30)
            upload_res.raise_for_status()
            handle = upload_res.json().get("h")
            print(f"   Header Handle Created: {handle[:30]}...")
            return handle

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Image upload to Meta failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Details: {e.response.text}")
        return None

def create_meta_template_with_image(template_name, body_text, footer_text=None, image_path=None):
    """Create a new WhatsApp template with Image Header directly on Meta."""
    formatted_name = template_name.strip().lower().replace(" ", "_")
    print(f"\n[CREATE] Creating Marketing Template '{formatted_name}' on Meta Account ({WABA_ID})...")
    
    components = []
    
    # 1. Header Image
    if image_path:
        handle = upload_image_for_meta_header(image_path)
        if handle:
            components.append({
                "type": "HEADER",
                "format": "IMAGE",
                "example": {
                    "header_handle": [handle]
                }
            })
            
    # 2. Body Text
    components.append({
        "type": "BODY",
        "text": body_text
    })
    if "{{1}}" in body_text:
        components[-1]["example"] = {"body_text": [["Customer Name", "OFFER50"]]}
        
    # 3. Footer Text
    if footer_text:
        components.append({
            "type": "FOOTER",
            "text": footer_text
        })

    payload = {
        "name": formatted_name,
        "language": "en_US",
        "category": "MARKETING",
        "components": components
    }
    
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/{WABA_ID}/message_templates"
    
    try:
        res = requests.post(url, headers=HEADERS, json=payload, timeout=20)
        res.raise_for_status()
        data = res.json()
        print(f"[SUCCESS] META TEMPLATE CREATED SUCCESSFULLY!")
        print(f"   • Meta Template ID: {data.get('id')}")
        print(f"   • Status:           {data.get('status')}")
        print(f"   • Category:         {data.get('category')}")
        return data
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to create template on Meta:")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Meta API Error: {e.response.text}")
        else:
            print(f"   Error: {e}")
        return None

def print_all_templates_summary():
    """Print clean formatted table of all templates currently on Meta Account."""
    templates = get_all_meta_templates()
    print("\n" + "=" * 85)
    print(f"[SUMMARY] LIVE META ACCOUNT TEMPLATES (WABA ACCOUNT ID: {WABA_ID})")
    print("=" * 85)
    print(f"{'INDEX':<6} | {'TEMPLATE NAME':<30} | {'CATEGORY':<12} | {'LANG':<7} | {'STATUS':<12} | {'META ID'}")
    print("-" * 85)
    
    for idx, t in enumerate(templates, 1):
        name = str(t.get("name", "N/A"))[:30]
        cat = str(t.get("category", "N/A"))[:12]
        lang = str(t.get("language", "N/A"))[:7]
        status = str(t.get("status", "N/A"))[:12]
        meta_id = str(t.get("id", "N/A"))
        print(f"{idx:<6} | {name:<30} | {cat:<12} | {lang:<7} | {status:<12} | {meta_id}")
        
    print("=" * 85)
    print(f"Total Live Meta Templates: {len(templates)}\n")

if __name__ == "__main__":
    print_all_templates_summary()
    
    if len(sys.argv) > 1:
        target_name = sys.argv[1]
        verify_template_on_meta(target_name)
