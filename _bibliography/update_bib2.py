import bibtexparser
import time
from scholarly import scholarly
import requests
from typing import Optional, Dict, Tuple
import re
from difflib import SequenceMatcher  # For title similarity

class PaperEnricher:
    def __init__(self):
        self.crossref_url = "https://api.crossref.org/works"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def clean_title(self, title: str) -> str:
        """Clean title for better LaTeX matching."""
        # Handle common LaTeX math mode
        title = re.sub(r'\$\\mathcal{H}_\\infty\$', 'h infinity', title)
        title = re.sub(r'\${.*?}\$', '', title)  # Remove other math mode
        # Remove LaTeX commands
        title = re.sub(r'\\[a-zA-Z]+{([^}]*)}', r'\1', title)
        # Remove special characters but keep basic punctuation
        title = re.sub(r'[^\w\s\-\,\.]', '', title.lower())
        return title.strip()

    def title_similarity(self, title1: str, title2: str) -> float:
        """Calculate title similarity using SequenceMatcher."""
        return SequenceMatcher(None, title1.lower(), title2.lower()).ratio()

    def find_crossref_doi(self, title: str, authors: str, year: str) -> Optional[str]:
        """Search for DOI using Crossref API."""
        try:
            # Clean author name
            first_author = authors.split(' and ')[0].split(',')[0].strip()
            first_author = re.sub(r'{\\[^}]*}([^}]*)}', r'\1', first_author)
            
            params = {
                'query.bibliographic': f"{title} {first_author}",
                'filter': f'from-pub-date:{year},until-pub-date:{year}',
                'select': 'DOI,title,author',
                'rows': 3
            }
            
            response = requests.get(self.crossref_url, params=params, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('message', {}).get('items', []):
                    if self.title_similarity(title, item.get('title', [''])[0]) > 0.8:
                        return item.get('DOI')
        except Exception as e:
            print(f"Error searching Crossref: {e}")
        return None


    def find_scholar_id(self, title: str, authors: str, year: str) -> Optional[str]:
        """Find Google Scholar ID using the scholarly library."""
        try:
            query = f"{title} {authors} {year}"  # More comprehensive query
            search_results = scholarly.search_pubs(query)

            for article in search_results:
                if self.title_similarity(title, article['bib']['title']) > 0.8: # More robust title similarity
                    return article['pub_url'] # Return the actual URL to the publication
            return None
        except Exception as e:
            print(f"Error in scholarly search: {e}")
            return None

    def process_entry(self, entry: Dict) -> Dict:
        """Process a single bibliography entry."""
        title = entry.get('title', '').strip()
        if not title:
            return entry
            
        print(f"\nProcessing: {title}")
        
        # Try to find DOI first
        if 'doi' not in entry:
            doi = self.find_crossref_doi(
                title,
                entry.get('author', ''),
                entry.get('year', '')
            )
            if doi:
                entry['doi'] = doi
                print(f"Found DOI: {doi}")
                # Add badges for papers with DOI
                entry['dimensions'] = 'true'
                entry['altmetric'] = 'true'
        
        # Try Google Scholar with retries
        if 'google_scholar_id' not in entry:
            retries = 3
            while retries > 0:
                try:
                    scholar_id = self.find_scholar_id(
                        title,
                        entry.get('author', ''),
                        entry.get('year', '')
                    )
                    if scholar_id:
                        entry['google_scholar_id'] = scholar_id
                        print(f"Found Scholar ID: {scholar_id}")
                        break
                    retries -= 1
                    if retries > 0:
                        time.sleep(5)  # Longer delay between retries
                except Exception as e:
                    print(f"Scholar search error (retries left: {retries}): {e}")
                    retries -= 1
                    time.sleep(10)
            
        return entry

def update_bib_file(input_file: str, output_file: str):
    """Update bib file with academic metrics."""
    try:
        with open(input_file, encoding='utf-8') as bibtex_file:
            parser = bibtexparser.bparser.BibTexParser(common_strings=True)
            bib_database = bibtexparser.load(bibtex_file, parser=parser)
    except Exception as e:
        print(f"Error reading input file: {e}")
        return
    
    enricher = PaperEnricher()
    total_entries = len(bib_database.entries)
    
    # Process each entry
    for i, entry in enumerate(bib_database.entries):
        print(f"\nEntry {i+1} of {total_entries}")
        try:
            bib_database.entries[i] = enricher.process_entry(entry)
        except Exception as e:
            print(f"Error processing entry: {e}")
            continue
        
        # Save progress every 3 entries
        if (i + 1) % 3 == 0:
            try:
                print(f"Saving progress... ({i+1}/{total_entries} entries processed)")
                writer = bibtexparser.bwriter.BibTexWriter()
                writer.indent = '  '
                with open(output_file, 'w', encoding='utf-8') as bibtex_file:
                    bibtex_file.write(writer.write(bib_database))
            except Exception as e:
                print(f"Error saving progress: {e}")
    
    # Final save
    try:
        writer = bibtexparser.bwriter.BibTexWriter()
        writer.indent = '  '
        writer.display_order = ['title', 'author', 'journal', 'booktitle', 'volume', 
                              'number', 'pages', 'year', 'publisher', 'doi', 
                              'google_scholar_id', 'dimensions', 'altmetric', 'selected']
        
        with open(output_file, 'w', encoding='utf-8') as bibtex_file:
            bibtex_file.write(writer.write(bib_database))
            
        print(f"\nProcessing complete. Updated file saved as: {output_file}")
    except Exception as e:
        print(f"Error saving final output: {e}")


if __name__ == "__main__":
    input_file = "papers.bib"
    output_file = "papers_updated.bib"
    update_bib_file(input_file, output_file)