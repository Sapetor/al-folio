import bibtexparser

def add_altmetric_field(input_file: str, output_file: str):
    """Adds the 'altmetric = {}' field to every entry in a .bib file."""

    try:
        with open(input_file, 'r', encoding='utf-8') as bibtex_file:
            parser = bibtexparser.bparser.BibTexParser(common_strings=True)
            bib_database = bibtexparser.load(bibtex_file, parser=parser)
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return
    except Exception as e:
        print(f"Error reading input file: {e}")
        return

    for entry in bib_database.entries:
        if 'altmetric' not in entry:  # Check if the field already exists
            entry['altmetric'] = '{}'  # Add the field with an empty value

    try:
        writer = bibtexparser.bwriter.BibTexWriter()
        writer.indent = '  '  # For nicely formatted output
        with open(output_file, 'w', encoding='utf-8') as bibtex_file:
            bibtex_file.write(writer.write(bib_database))
        print(f"Successfully added 'altmetric = {{}}' to all entries. Saved to '{output_file}'.")

    except Exception as e:
        print(f"Error writing output file: {e}")


if __name__ == "__main__":
    input_file = "papers.bib"  # Replace with your input file
    output_file = "papers_updated3.bib"  # Replace with your desired output file
    add_altmetric_field(input_file, output_file)