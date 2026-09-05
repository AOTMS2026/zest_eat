# Meta WhatsApp Template Verification Test Suite (Python)

This `testing` directory contains Python scripts to verify live Meta WhatsApp Business Account templates directly via Meta Graph API v19.0.

## WABA Account Details
- **WABA Account ID**: `1026026910332703` (Academy Of Tech Masters)
- **Phone Number ID**: `1340972425758369` (+91 80199 74443)

## Requirements
Ensure `requests` is installed in your Python environment:
```bash
pip install requests
```

## Usage

### 1. View All Live Meta Templates
To list all live templates (including `APPROVED`, `PENDING`, and `REJECTED` status) from Meta Account:
```bash
python testing/verify_meta_templates.py
```

### 2. Verify a Specific Template by Name
To verify if a specific template created on your website exists on Meta Account:
```bash
python testing/verify_meta_templates.py aotms_tally_gst_course
```
