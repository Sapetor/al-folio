import bibtexparser
import requests
import json
import time
from typing import Optional

class AbstractEnricher:
    def __init__(self):
        self.semantic_scholar_url = "http://api.semanticscholar.org/v1/paper/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def get_abstract_from_semantic_scholar(self, doi: str) -> Optional[str]:
        """Fetch abstract using DOI from Semantic Scholar."""
        try:
            print(f"\nTrying to fetch abstract for DOI: {doi}")
            url = f"{self.semantic_scholar_url}DOI:{doi}"
            print(f"URL: {url}")
            
            response = requests.get(url, headers=self.headers)
            print(f"Response status code: {response.status_code}")
            
            if response.status_code == 200:
                paper = response.json()
                if 'abstract' in paper and paper['abstract']:
                    abstract = paper['abstract']
                    print("Found abstract:", abstract[:100] + "..." if len(abstract) > 100 else abstract)
                    return abstract
                else:
                    print("No abstract field in response")
                    
            return None
        except Exception as e:
            print(f"Error details: {str(e)}")
            return None

    def process_entry(self, entry):
        """Process a single bibliography entry."""
        if 'abstract' in entry:
            print(f"Abstract already exists for: {entry.get('title', 'Unknown Title')}")
            return entry
            
        if 'doi' in entry:
            print(f"\nProcessing: {entry.get('title', 'Unknown Title')}")
            abstract = self.get_abstract_from_semantic_scholar(entry['doi'])
            if abstract:
                entry['abstract'] = abstract
                print(f"Successfully added abstract")
            else:
                print(f"No abstract found")
                
        return entry

def update_bib_file(input_file: str, output_file: str):
    """Update bib file with abstracts."""
    print(f"Reading input file: {input_file}")
    try:
        with open(input_file, encoding='utf-8') as bibtex_file:
            parser = bibtexparser.bparser.BibTexParser(common_strings=True)
            bib_database = bibtexparser.load(bibtex_file, parser=parser)
            print(f"Successfully loaded {len(bib_database.entries)} entries")
    except Exception as e:
        print(f"Error reading input file: {e}")
        return
    
    enricher = AbstractEnricher()
    total_entries = len(bib_database.entries)
    entries_with_abstracts = 0
    entries_processed = 0
    
    # Process each entry
    for i, entry in enumerate(bib_database.entries):
        print(f"\n--- Entry {i+1} of {total_entries} ---")
        try:
            result = enricher.process_entry(entry)
            bib_database.entries[i] = result
            entries_processed += 1
            if 'abstract' in result:
                entries_with_abstracts += 1
        except Exception as e:
            print(f"Error processing entry: {e}")
            continue
        
        # Save progress every 5 entries
        if (i + 1) % 5 == 0:
            try:
                print(f"\nSaving progress... ({i+1}/{total_entries} entries processed)")
                writer = bibtexparser.bwriter.BibTexWriter()
                writer.indent = '  '
                writer.display_order = [
                    'title', 'author', 'journal', 'booktitle', 'volume', 
                    'number', 'pages', 'year', 'publisher', 'doi', 
                    'abstract', 'selected', 'preview', 'bibtex_show',
                    'google_scholar_id', 'dimensions', 'altmetric'
                ]
                with open(output_file, 'w', encoding='utf-8') as bibtex_file:
                    bibtex_file.write(writer.write(bib_database))
                print(f"Progress saved to {output_file}")
            except Exception as e:
                print(f"Error saving progress: {e}")
        
        time.sleep(1)  # Rate limiting
    
    print(f"\n=== Final Statistics ===")
    print(f"Total entries processed: {entries_processed}")
    print(f"Entries with abstracts: {entries_with_abstracts}")
    
    # Final save
    try:
        writer = bibtexparser.bwriter.BibTexWriter()
        writer.indent = '  '
        writer.display_order = [
            'title', 'author', 'journal', 'booktitle', 'volume', 
            'number', 'pages', 'year', 'publisher', 'doi', 
            'abstract', 'selected', 'preview', 'bibtex_show',
            'google_scholar_id', 'dimensions', 'altmetric'
        ]
        with open(output_file, 'w', encoding='utf-8') as bibtex_file:
            bibtex_file.write(writer.write(bib_database))
            
        print(f"\nProcessing complete. Updated file saved as: {output_file}")
    except Exception as e:
        print(f"Error saving final output: {e}")

if __name__ == "__main__":
    input_file = "papers.bib"
    output_file = "papers_with_abstracts.bib"
    update_bib_file(input_file, output_file)