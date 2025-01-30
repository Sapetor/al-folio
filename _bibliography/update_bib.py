import bibtexparser
import time
from scholarly import scholarly
from typing import Optional, Dict
import re

class PaperEnricher:
    def clean_title(self, title: str) -> str:
        """Clean title for matching."""
        # Remove LaTeX commands
        title = re.sub(r'\\[a-zA-Z]+{([^}]*)}', r'\1', title)
        # Remove special characters but keep basic punctuation
        title = re.sub(r'[^\w\s\-\,\.]', '', title.lower())
        return title.strip()

    def title_similarity(self, title1: str, title2: str) -> float:
        """Calculate similarity between two titles."""
        t1 = self.clean_title(title1)
        t2 = self.clean_title(title2)
        
        # Split into words and get sets
        words1 = set(t1.split())
        words2 = set(t2.split())
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0

    def find_scholar_id(self, title: str, authors: str, year: str) -> Optional[str]:
        """Search for Google Scholar ID with exact match."""
        try:
            # Add delay to avoid rate limiting
            time.sleep(3)
            
            # Get first author's last name
            first_author = authors.split(' and ')[0].split(',')[0].strip()
            first_author = re.sub(r'{\\[^}]*}([^}]*)}', r'\1', first_author)
            
            # Create specific search query
            search_query = f'"{title}" author:"{first_author}"'
            print(f"Searching Scholar with: {search_query}")
            
            # Search for the paper
            search_results = scholarly.search_pubs(search_query)
            
            # Check first few results
            for _ in range(3):
                try:
                    paper = next(search_results)
                    if hasattr(paper, 'bib'):
                        similarity = self.title_similarity(title, paper.bib.get('title', ''))
                        print(f"Found paper: {paper.bib.get('title', '')}")
                        print(f"Similarity: {similarity}")
                        
                        if similarity > 0.8:  # High similarity threshold
                            if hasattr(paper, 'scholar_id'):
                                return paper.scholar_id
                            elif hasattr(paper, 'id_citations'):
                                return paper.id_citations
                            elif hasattr(paper, 'pub_url'):
                                match = re.search(r'citation_for_view=.*?:(.*?)($|&)', paper.pub_url)
                                if match:
                                    return match.group(1)
                except StopIteration:
                    break
                except Exception as e:
                    print(f"Error processing result: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error searching Google Scholar for {title}: {e}")
        return None

    def process_entry(self, entry: Dict) -> Dict:
        """Process a single bibliography entry."""
        title = entry.get('title', '').strip()
        if not title:
            return entry
            
        print(f"\nProcessing: {title}")
        
        # Skip if already has google_scholar_id
        if 'google_scholar_id' not in entry:
            scholar_id = self.find_scholar_id(
                title,
                entry.get('author', ''),
                entry.get('year', '')
            )
            if scholar_id:
                entry['google_scholar_id'] = scholar_id
                print(f"Found Scholar ID: {scholar_id}")
            else:
                print("No Scholar ID found")
        else:
            print(f"Already has Scholar ID: {entry.get('google_scholar_id')}")
        
        # Add dimensions badge if DOI exists
        if 'doi' in entry and 'dimensions' not in entry:
            entry['dimensions'] = 'true'
        
        # Add altmetric badge if DOI exists
        if 'doi' in entry and 'altmetric' not in entry:
            entry['altmetric'] = 'true'
            
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