# Office Document Test Fixtures

This directory contains test fixtures for office document processing tests.

## DOCX Files (Microsoft Word)

### sample.docx
Simple Word document demonstrating:
- Headings (levels 0-2)
- Paragraphs with text
- Bulleted lists
- Numbered lists
- Tables with headers and data

**Use for:** Basic DOCX parsing and content extraction tests

### complex.docx
Complex Word document featuring:
- Document metadata (title, author, subject, keywords, comments)
- Multiple sections and subsections
- Styled text (bold, italic, colored)
- Complex tables with multiple rows and columns

**Use for:** Metadata extraction and advanced formatting tests

### empty.docx
Empty Word document with no content.

**Use for:** Edge case testing and empty document handling

## PPTX Files (Microsoft PowerPoint)

### sample.pptx
Simple presentation with 3 slides:
- Slide 1: Title slide
- Slide 2: Content slide with bullet points
- Slide 3: Conclusion slide

**Use for:** Basic PPTX parsing and slide extraction tests

### notes.pptx
Presentation with speaker notes:
- 3 slides with detailed speaker notes on each slide
- Demonstrates notes extraction capability

**Use for:** Speaker notes extraction tests

### empty.pptx
Empty PowerPoint presentation with no slides.

**Use for:** Edge case testing and empty presentation handling

## XLSX Files (Microsoft Excel)

### sample.xlsx
Simple workbook with 2 sheets:
- **Employees**: Employee data with ID, name, department, salary
- **Sales**: Monthly sales data with product information

**Use for:** Basic XLSX parsing and multi-sheet tests

### complex.xlsx
Complex workbook with 4 sheets:
- **Dashboard**: Summary metrics
- **Detailed Sales**: 50 rows of sales transactions
- **Product Catalog**: 20 products with details
- **Monthly Summary**: 6 months of aggregated data

**Use for:** Complex data extraction and multi-sheet processing tests

### empty.xlsx
Empty Excel workbook with one blank sheet.

**Use for:** Edge case testing and empty workbook handling

## Edge Cases and Error Handling

### invalid.zip
Regular ZIP archive containing non-office files:
- readme.txt
- data.json
- config.xml

**Use for:** Negative testing - verifying proper rejection of non-office files

### corrupted.docx
Malformed DOCX file:
- Has ZIP structure but corrupted XML content
- Contains invalid Office Open XML

**Use for:** Error handling tests - verifying graceful degradation with corrupted files

## File Sizes

- sample.docx: ~37 KB
- complex.docx: ~37 KB
- empty.docx: ~36 KB
- sample.pptx: ~30 KB
- notes.pptx: ~37 KB
- empty.pptx: ~27 KB
- sample.xlsx: ~6 KB
- complex.xlsx: ~10 KB
- empty.xlsx: ~5 KB
- invalid.zip: ~400 bytes
- corrupted.docx: ~600 bytes

## Generation

These fixtures were generated using Python libraries:
- `python-docx` for DOCX files
- `python-pptx` for PPTX files
- `openpyxl` for XLSX files

To regenerate all fixtures, run the Python script in `/tmp/create_office_fixtures.py`.
