import re
from typing import List

def normalize_name_variants(first, last, handle, url):
    variants = []
    def extract_from_string(s):
        if not s: return []
        res = re.split(r'[/.\-_]', s)
        return [r for r in res if r and len(r) > 1]
    
    if first:
        f_clean = re.sub(r'\s*[\(\[].*?[\)\]]', '', first).strip()
        variants.append(first)
        variants.append(f_clean)
        if ' ' in f_clean: variants.append(f_clean.split()[0])
    if last:
        l_clean = re.sub(r'\s*[\(\[].*?[\)\]]', '', last).strip()
        variants.append(last)
        variants.append(l_clean)
    if handle: variants.extend(extract_from_string(handle))
    if url: variants.extend(extract_from_string(url))
    if first and last:
        f_c = re.sub(r'\s*[\(\[].*?[\)\]]', '', first).strip()
        l_c = re.sub(r'\s*[\(\[].*?[\)\]]', '', last).strip()
        variants.append(f"{f_c} {l_c}")
        variants.append(f"{f_c} {l_c[0]}.")
    return sorted(list(set([v for v in variants if v and len(v) > 1])), key=len, reverse=True)

def strip_signature(text, names):
    closings = r'(Best regards|Regards|Best|Sincerely|Kind regards|Cheers|Thanks|Thank you|Best wishes|All the best|Warmly|Warm regards)'
    lines = text.strip().split('\n')
    if len(lines) < 2: return text
    last_line = lines[-1].strip().strip(',.!')
    is_name = any(last_line.lower() == n.lower() for n in names) or (len(last_line) <= 2 and last_line.isupper())
    penultimate = lines[-2].strip().strip(',.!')
    is_closing = re.match(rf'^{closings}$', penultimate, re.I)
    if is_name and is_closing: return '\n'.join(lines[:-2]).strip()
    if is_name and len(lines) > 2 and not lines[-2].strip(): return '\n'.join(lines[:-1]).strip()
    return text

def normalize_message(msg: str, lead, profile_names: List[str]) -> str:
    if not msg: return ""
    
    normalized = msg.lstrip()
    name_variants = normalize_name_variants(lead.first_name, lead.last_name, lead.linkedin_handle, lead.linkedin_url)
    
    # 1. Catch parenthetical patterns
    if lead.first_name:
        normalized = re.sub(rf'^{re.escape(lead.first_name)}\s*\([^)]*\)', lead.first_name, normalized, flags=re.I)
    
    # 2. Extract potential names
    m_fb = re.search(r'\b(Hi|Hello|Hey|Greetings|Dear)\s+([A-Z][^?!:,\n]{1,25})\b', normalized, flags=re.I)
    local_name_variants = list(name_variants)
    if m_fb and m_fb.start() < 25: 
        v_extracted = m_fb.group(2).strip()
        if v_extracted not in local_name_variants:
            local_name_variants.append(v_extracted)
    
    m_fb_short = re.search(r'^([^?!:,\n]{1,20})\s*[?!.]{0,3}\s*[:;][\(\)DP]', normalized)
    if m_fb_short:
        v_extracted = m_fb_short.group(1).strip()
        if v_extracted not in local_name_variants:
            local_name_variants.append(v_extracted)

    # 3. Apply standard name replacement
    for var in sorted(local_name_variants, key=len, reverse=True):
        p_greet, p_title = r'Hi|Hello|Hey|Greetings|Dear', r'Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?'
        pattern = rf'({p_greet})?\s*({p_title})?\s*\b{re.escape(var)}(\s*[\(\[].*?[\)\]])*(\s+[A-Z]\.?)*'
        match = re.search(pattern, normalized, flags=re.I)
        if match and match.start() < 30:
            start, end = match.span()
            punctuation = normalized[end] if end < len(normalized) and normalized[end] in ',!?.' else ""
            if punctuation: end += 1
            g, t = match.group(1) or "", match.group(2) or ""
            res = f"Hi {t} {{{{firstName}}}}{punctuation}" if g else f"{t} {{{{firstName}}}}{punctuation}"
            normalized = normalized[:start] + re.sub(r'\s+', ' ', res).strip() + normalized[end:]
            break 

    # 4. Final safety cleanup
    normalized = re.sub(r'^[A-Z][a-z\s]+\s*\(\{\{firstName\}\}\)', '{{firstName}}', normalized)

    if lead.current_employer:
        # Simple company normalization
        company = lead.current_employer
        normalized = re.sub(rf'{re.escape(company)}(\s*[\(\[].*?[\)\]])?', '{{companyName}}', normalized, flags=re.I)

    return strip_signature(normalized, profile_names)
