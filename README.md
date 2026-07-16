# XML Generation & Schema Validation Demo

Structured data → specification-compliant XML → automated schema validation.

A working demonstration of the pipeline used when implementing a documented
filing format: map input fields onto an exact document structure, then prove
the generated file conforms to the published schema before it is submitted.

**Live demo:** https://etax-xml-demo.phaiworks.com

---

## Pipeline

```
   JSON input
       │
       ▼
┌──────────────────┐   Pydantic       type / range / lexical constraints
│ Input validation │   models.py      rejects malformed data up front
└──────────────────┘
       │
       ▼
┌──────────────────┐   lxml           field → XPath mapping
│  XML generation  │   build_xml()    element order is significant (xs:sequence)
└──────────────────┘
       │
       ▼
┌──────────────────┐   lxml.etree     validates the *generated document*
│  XSD validation  │   XMLSchema      against tax_return.xsd
└──────────────────┘
       │
       ▼
  ✅ Valid  /  ❌ Invalid + exact schema errors
```

The third stage is the point. Validating the output against the specification
catches mapping bugs that unit tests on the input side cannot see — a field
written to the wrong position, a truncated identifier, a missing required
element.

## Proving the validation is real

The demo can deliberately inject known mapping bugs. Each one produces a
document that is well-formed XML but violates the schema, and the validator
reports exactly why:

| Injected bug | XSD error reported |
|---|---|
| Identifier written with 12 digits | `[facet 'pattern'] The value '123456789012' is not accepted` |
| Two elements emitted in the wrong order | `Element 'Deductions': This element is not expected. Expected is ( GrossIncome )` |
| Required element omitted | `Element 'Tax': Missing child element(s). Expected is ( TaxDue )` |
| Negative value in an unsigned field | `'-5000000' is not a valid value of the atomic type 'xs:nonNegativeInteger'` |

The element-order case is the one that matters most in practice: every value is
individually correct, and only the schema catches the placement error.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript strict |
| Backend | Python 3.12, FastAPI, Pydantic v2, lxml |
| Schema | W3C XML Schema (XSD 1.0) |
| Hosting | Vercel (Next.js + Python serverless function) |

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/py/generate` | Validate input, build XML, validate against XSD |
| `GET` | `/api/py/schema` | Return the XSD used for validation |
| `GET` | `/api/py/sabotage-options` | List the injectable mapping bugs |
| `GET` | `/api/py/docs` | OpenAPI (Swagger) UI |

Request:

```json
{
  "data": {
    "taxpayer_name": "Taro Yamada",
    "taxpayer_id": "1234567890123",
    "address": "1-1-1 Marunouchi, Chiyoda-ku, Tokyo",
    "tax_year": 2025,
    "gross_income": 5000000,
    "deductions": 1200000
  },
  "sabotage": "none"
}
```

Response:

```json
{
  "xml": "<?xml version='1.0' encoding='UTF-8'?>\n<TaxReturn version=\"1.0\">...",
  "valid": true,
  "errors": [],
  "mapping": [
    { "source": "gross_income", "target": "/TaxReturn/Income/GrossIncome", "value": "5000000" }
  ],
  "computed": { "taxable_income": 3800000, "tax_due": 380000 }
}
```

## Local development

The Next.js dev server and the Python API run as two processes.

```bash
npm install
pip install -r requirements.txt

npm run api    # FastAPI on :8001
npm run dev    # Next.js on :3233
```

`next.config.ts` rewrites `/api/py/*` to the local FastAPI process in
development, and to the Vercel serverless function in production, so the
frontend code is identical in both.

## Scope

The schema in `api/tax_return.xsd` is an original, simplified structure written
for this demo. It is **not** the Japanese NTA e-Tax specification, and no
NTA material is reproduced here. It reproduces the structural characteristics
that make a real filing format non-trivial — strict element ordering, nested
record blocks, lexical constraints on identifiers, typed numeric fields, and
required attributes.

A production implementation maps several hundred fields against the published
specification. The tax rate is simplified to a flat 10%. Neither changes the
pipeline or the validation mechanism.

All sample data is fictional. "Taro Yamada" is the standard placeholder name on
Japanese forms — the equivalent of "John Doe".

---

Built by [PH AI Works](https://phaiworks.com).
