from scholarly import scholarly
import json
import time
import re

def extract_scholar_id(citation_data):
    # Print full citation data for debugging
    print("Citation data:", citation_data)
    
    if 'url_scholarbib' in citation_data:
        url = citation_data['url_scholarbib']
        print("URL found:", url)
        match = re.search(r'MrFi22oAAAAJ:([A-Za-z0-9_-]+)', url)
        if match:
            scholar_id = match.group(1)
            print("Extracted Scholar ID:", scholar_id)
            return scholar_id
    return None

def get_scholar_ids():
    author = scholarly.search_author_id('MrFi22oAAAAJ')
    scholarly.fill(author)
    
    paper_ids = {}
    total = len(author['publications'])
    print(f"Found {total} publications")
    
    for i, pub in enumerate(author['publications'], 1):
        title = pub['bib']['title']
        print(f"\nPaper {i}/{total}")
        print(f"Title: {title}")
        
        try:
            scholarly.fill(pub)
            scholar_id = extract_scholar_id(pub)
            if scholar_id:
                paper_ids[title] = scholar_id
            time.sleep(3)
            
        except Exception as e:
            print(f"Error:", e)
            continue

    print("\nFound IDs:", len(paper_ids))
    with open('scholar_ids_4.json', 'w', indent=2) as f:
        json.dump(paper_ids, f)

if __name__ == "__main__":
    get_scholar_ids()