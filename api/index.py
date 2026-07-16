"""
e-Tax style XML generation demo — Python backend.

Pipeline:

    JSON  ->  Pydantic (input validation)
          ->  lxml     (field mapping / XML construction)
          ->  XMLSchema(XSD)  (output validation against the specification)

The second validation pass is the point of this service: it checks the
*generated document* against the published schema, so a mapping bug is
caught before the file is ever submitted. The /generate endpoint can
deliberately inject known mapping bugs (see Sabotage) to demonstrate that
the check is real rather than decorative.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from lxml import etree
from pydantic import BaseModel, Field, ValidationError, field_validator

SCHEMA_PATH = Path(__file__).parent / "tax_return.xsd"

DOCUMENT_VERSION = "1.0"
SOFTWARE_ID = "PHAIWORKS-DEMO-001"

# Simplified flat rate. A production implementation applies the progressive
# bracket table from the specification; it does not change the XML pipeline.
TAX_RATE = 0.10

Sabotage = Literal["none", "bad_id", "wrong_order", "missing_field", "bad_type"]

SABOTAGE_LABELS: dict[str, str] = {
    "none": "Correct mapping",
    "bad_id": "Write the ID with 12 digits (pattern violation)",
    "wrong_order": "Swap two elements inside Income (sequence violation)",
    "missing_field": "Omit the required TaxDue element (structural violation)",
    "bad_type": "Write a negative GrossIncome (type violation)",
}


class TaxData(BaseModel):
    """Input contract. Rejects malformed data before any XML is built."""

    taxpayer_name: str = Field(min_length=1, max_length=64)
    taxpayer_id: str
    address: str = Field(min_length=1, max_length=128)
    tax_year: int = Field(ge=2000, le=2100)
    gross_income: int = Field(ge=0, le=10**12)
    deductions: int = Field(ge=0, le=10**12)

    @field_validator("taxpayer_id")
    @classmethod
    def check_id(cls, v: str) -> str:
        if not (v.isdigit() and len(v) == 13):
            raise ValueError("taxpayer_id must be exactly 13 digits")
        return v


class GenerateRequest(BaseModel):
    data: TaxData
    sabotage: Sabotage = "none"


def compute(d: TaxData) -> tuple[int, int]:
    """Derive the fields the specification requires us to calculate."""
    taxable = max(d.gross_income - d.deductions, 0)
    tax_due = int(taxable * TAX_RATE)
    return taxable, tax_due


def build_xml(d: TaxData, sabotage: Sabotage = "none") -> bytes:
    """Map validated input onto the document tree.

    Element order here is significant: the XSD declares xs:sequence, so a
    field written in the wrong position produces an invalid document even
    though every individual value is correct.
    """
    taxable, tax_due = compute(d)

    taxpayer_id = d.taxpayer_id[:12] if sabotage == "bad_id" else d.taxpayer_id
    gross = -d.gross_income if sabotage == "bad_type" else d.gross_income

    root = etree.Element("TaxReturn", version=DOCUMENT_VERSION)

    header = etree.SubElement(root, "Header")
    etree.SubElement(header, "TaxYear").text = str(d.tax_year)
    etree.SubElement(header, "SoftwareId").text = SOFTWARE_ID

    taxpayer = etree.SubElement(root, "Taxpayer")
    etree.SubElement(taxpayer, "TaxpayerName").text = d.taxpayer_name
    etree.SubElement(taxpayer, "TaxpayerId").text = taxpayer_id
    etree.SubElement(taxpayer, "Address").text = d.address

    income = etree.SubElement(root, "Income")
    income_fields = [
        ("GrossIncome", str(gross)),
        ("Deductions", str(d.deductions)),
        ("TaxableIncome", str(taxable)),
    ]
    if sabotage == "wrong_order":
        income_fields[0], income_fields[1] = income_fields[1], income_fields[0]
    for tag, value in income_fields:
        etree.SubElement(income, tag).text = value

    tax = etree.SubElement(root, "Tax")
    if sabotage != "missing_field":
        etree.SubElement(tax, "TaxDue").text = str(tax_due)

    return etree.tostring(
        root, xml_declaration=True, encoding="UTF-8", pretty_print=True
    )


def validate(xml_bytes: bytes) -> tuple[bool, list[dict[str, object]]]:
    """Validate the generated document against the XSD."""
    schema = etree.XMLSchema(etree.parse(str(SCHEMA_PATH)))
    doc = etree.fromstring(xml_bytes)
    ok = schema.validate(doc)
    errors = [
        {"line": e.line, "message": e.message} for e in schema.error_log
    ]
    return ok, errors


def mapping_table(d: TaxData, sabotage: Sabotage) -> list[dict[str, str]]:
    """The source -> XPath correspondence, surfaced for the UI.

    A production mapping is this same table with several hundred rows.
    """
    taxable, tax_due = compute(d)
    rows = [
        ("(constant)", "/TaxReturn/@version", DOCUMENT_VERSION),
        ("tax_year", "/TaxReturn/Header/TaxYear", str(d.tax_year)),
        ("(constant)", "/TaxReturn/Header/SoftwareId", SOFTWARE_ID),
        ("taxpayer_name", "/TaxReturn/Taxpayer/TaxpayerName", d.taxpayer_name),
        ("taxpayer_id", "/TaxReturn/Taxpayer/TaxpayerId", d.taxpayer_id),
        ("address", "/TaxReturn/Taxpayer/Address", d.address),
        ("gross_income", "/TaxReturn/Income/GrossIncome", str(d.gross_income)),
        ("deductions", "/TaxReturn/Income/Deductions", str(d.deductions)),
        ("(derived)", "/TaxReturn/Income/TaxableIncome", str(taxable)),
        ("(derived)", "/TaxReturn/Tax/TaxDue", str(tax_due)),
    ]
    return [{"source": s, "target": t, "value": v} for s, t, v in rows]


app = FastAPI(title="e-Tax XML Demo", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")


@app.get("/api/py/schema")
def get_schema() -> JSONResponse:
    return JSONResponse({"xsd": SCHEMA_PATH.read_text(encoding="utf-8")})


@app.get("/api/py/sabotage-options")
def get_sabotage_options() -> JSONResponse:
    return JSONResponse(
        {"options": [{"id": k, "label": v} for k, v in SABOTAGE_LABELS.items()]}
    )


@app.post("/api/py/generate")
def generate(req: GenerateRequest) -> JSONResponse:
    xml_bytes = build_xml(req.data, req.sabotage)
    ok, errors = validate(xml_bytes)
    taxable, tax_due = compute(req.data)
    return JSONResponse(
        {
            "xml": xml_bytes.decode("utf-8"),
            "valid": ok,
            "errors": errors,
            "mapping": mapping_table(req.data, req.sabotage),
            "computed": {"taxable_income": taxable, "tax_due": tax_due},
            "sabotage": req.sabotage,
            "sabotage_label": SABOTAGE_LABELS[req.sabotage],
        }
    )


@app.exception_handler(ValidationError)
def on_validation_error(_request: object, exc: ValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"input_errors": exc.errors()})
