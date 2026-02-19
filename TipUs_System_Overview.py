#!/usr/bin/env python3
"""Generate TipUs System Overview & Next Steps PDF for Gonzalo."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

# ── Colors (matching reference PDF style) ──
COPPER = HexColor("#C07A50")
DARK = HexColor("#1A1A2E")
GRAY = HexColor("#6B7280")
LIGHT_GRAY = HexColor("#9CA3AF")
WHITE = HexColor("#FFFFFF")
BORDER = HexColor("#E5E7EB")
TABLE_HEADER_BG = HexColor("#E8D5B7")
TABLE_ROW_BG = HexColor("#FAFAFA")
GREEN = HexColor("#059669")
CRED_BG = HexColor("#FEF9F0")

# ── Styles ──
title_style = ParagraphStyle(
    "Title", fontName="Helvetica-Bold", fontSize=26,
    textColor=DARK, leading=30, spaceAfter=1,
)
subtitle_style = ParagraphStyle(
    "Subtitle", fontName="Helvetica", fontSize=11,
    textColor=GRAY, leading=14, spaceAfter=0,
)
date_style = ParagraphStyle(
    "Date", fontName="Helvetica", fontSize=8.5,
    textColor=LIGHT_GRAY, spaceBefore=12, spaceAfter=0,
)
section_heading = ParagraphStyle(
    "SectionHeading", fontName="Helvetica-Bold", fontSize=14,
    textColor=COPPER, leading=18, spaceBefore=14, spaceAfter=6,
)
body_style = ParagraphStyle(
    "Body", fontName="Helvetica", fontSize=9.5,
    textColor=DARK, leading=13.5, spaceAfter=4,
)
bullet_style = ParagraphStyle(
    "Bullet", fontName="Helvetica", fontSize=9.5,
    textColor=DARK, leading=13.5, leftIndent=16, spaceAfter=3,
    bulletIndent=0,
)
note_style = ParagraphStyle(
    "Note", fontName="Helvetica-Oblique", fontSize=8.5,
    textColor=GRAY, leading=12, spaceAfter=4,
)
footer_style = ParagraphStyle(
    "Footer", fontName="Helvetica", fontSize=7.5,
    textColor=LIGHT_GRAY, alignment=TA_CENTER,
)

# Table cell styles
cell_header = ParagraphStyle(
    "CellHeader", fontName="Helvetica-Bold", fontSize=9.5,
    textColor=DARK, leading=13,
)
cell_body = ParagraphStyle(
    "CellBody", fontName="Helvetica", fontSize=9.5,
    textColor=DARK, leading=13,
)
cell_small = ParagraphStyle(
    "CellSmall", fontName="Helvetica", fontSize=8.5,
    textColor=GRAY, leading=12,
)


def build_pdf():
    doc = SimpleDocTemplate(
        "/Users/mukelakatungu/tipus/TipUs_System_Overview_Next_Steps.pdf",
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=2.3 * cm,
        rightMargin=2.3 * cm,
    )
    story = []
    w = doc.width

    # ══════════════════════════════════════
    # TITLE BLOCK
    # ══════════════════════════════════════
    story.append(Paragraph("TipUs", title_style))
    story.append(Paragraph(
        "Digital Tipping Platform for Australian Hospitality", subtitle_style
    ))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=2.5, color=COPPER, spaceAfter=0))
    story.append(Paragraph(
        "System Overview &amp; Next Steps  |  Prepared for Gonzalo Sauma  |  18 February 2026",
        date_style,
    ))

    # ══════════════════════════════════════
    # 1. SYSTEM OVERVIEW
    # ══════════════════════════════════════
    story.append(Paragraph("1. System Overview", section_heading))
    story.append(Paragraph(
        "<b>TipUs</b> is a digital tipping platform designed for Australian hospitality venues. "
        "Customers scan a QR code at a venue, select a tip amount, and pay instantly with their "
        "card or digital wallet (Apple Pay / Google Pay).",
        body_style,
    ))
    story.append(Paragraph(
        "All tip money stays on the TipUs platform. Venues never touch money or Stripe directly. "
        "At payout time, TipUs keeps a 5% platform fee and distributes 95% to employees, prorated "
        "by their active days in the period. Money goes directly to each employee\u2019s Australian "
        "bank account via Stripe.",
        body_style,
    ))

    # Summary table
    summary_data = [
        [Paragraph("<b>Overall Status</b>", cell_header),
         Paragraph("<b>Detail</b>", cell_header)],
        [Paragraph("<b>Core Features</b>", cell_header),
         Paragraph("All implemented and tested in test mode", cell_body)],
        [Paragraph("<b>Payment Processing</b>", cell_header),
         Paragraph("Fully working via Stripe (platform-direct model)", cell_body)],
        [Paragraph("<b>Money Flow</b>", cell_header),
         Paragraph("100% stays on TipUs platform until payout", cell_body)],
        [Paragraph("<b>Payout Safety</b>", cell_header),
         Paragraph("Per-employee tracking prevents double-payments", cell_body)],
        [Paragraph("<b>Current Mode</b>", cell_header),
         Paragraph("Test mode (ready for live switch)", cell_body)],
    ]
    summary_table = Table(summary_data, colWidths=[w * 0.30, w * 0.70])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
        ("BACKGROUND", (0, 1), (-1, 1), TABLE_ROW_BG),
        ("BACKGROUND", (0, 3), (-1, 3), TABLE_ROW_BG),
        ("BACKGROUND", (0, 5), (-1, 5), TABLE_ROW_BG),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 4))
    story.append(summary_table)

    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "Live test URL:  <b>tipusaus.netlify.app</b>",
        ParagraphStyle("url", fontName="Helvetica", fontSize=8.5, textColor=COPPER, leading=12),
    ))

    # ══════════════════════════════════════
    # 2. USER ROLES
    # ══════════════════════════════════════
    story.append(Paragraph("2. User Roles", section_heading))

    roles_data = [
        [Paragraph("<b>Role</b>", cell_header),
         Paragraph("<b>Responsibilities</b>", cell_header)],
        [Paragraph("<b>Admin (TipUs)</b>", cell_header),
         Paragraph("Manages all venues, creates QR codes, triggers and monitors payouts, full platform oversight", cell_body)],
        [Paragraph("<b>Venue Owner</b>", cell_header),
         Paragraph("Registers venue, invites/manages employees, sets payout frequency, views tip &amp; payout history (read-only)", cell_body)],
        [Paragraph("<b>Employee</b>", cell_header),
         Paragraph("Accepts invite, enters bank details, views personal tips &amp; payout history, updates profile", cell_body)],
    ]
    roles_table = Table(roles_data, colWidths=[w * 0.25, w * 0.75])
    roles_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(roles_table)

    # ══════════════════════════════════════
    # 3. KEY FEATURES
    # ══════════════════════════════════════
    story.append(Paragraph("3. Key Features", section_heading))

    features = [
        ("Real-time notifications", "for tips, QR code creation, and payout status"),
        ("Guided onboarding tutorial", "for new venue owners and employees"),
        ("Prorated payout calculations", "when employees join or leave mid-period"),
        ("Per-employee payout tracking", "with visibility into failures and reasons"),
        ("5% platform fee", "automatically deducted before distribution"),
        ("Employee invite system", "via email with secure setup flow"),
        ("Mobile responsive", "full mobile experience with bottom navigation"),
    ]
    for title, desc in features:
        story.append(Paragraph(
            f'<font color="#059669">&#x2713;</font>  <b>{title}</b> \u2014 {desc}',
            bullet_style,
        ))

    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "<b>Tech Stack:</b>  React + TypeScript  |  Supabase (database, auth, edge functions)  "
        "|  Stripe (payments &amp; transfers)  |  Netlify (hosting)  |  Resend (email)",
        ParagraphStyle("tech", fontName="Helvetica", fontSize=8.5, textColor=GRAY, leading=12),
    ))

    # ══════════════════════════════════════
    # 4. ACTION ITEMS FOR GONZALO
    # ══════════════════════════════════════
    story.append(Paragraph("4. Action Items for Gonzalo", section_heading))
    story.append(Paragraph(
        "The platform is fully functional in <b>test mode</b>. "
        "To go live with real money, the following items need to be completed:",
        body_style,
    ))

    actions = [
        ("Domain Name",
         "Purchase a domain (e.g. tipus.com.au or tipusaus.com) via GoDaddy or similar. "
         "A custom domain is <b>required before Stripe can go live</b>."),
        ("Hosting Decision",
         "The app is deployed on Netlify under our account. You can either: (a) continue with us "
         "hosting it, or (b) create your own Netlify account and we transfer the project."),
        ("Email Service",
         "We currently use our own Resend API keys for employee invitation emails. Supabase\u2019s "
         "built-in email (2\u201330 msgs/hour) is not suitable for production. You\u2019ll need "
         "your own <b>Resend account</b> (free: 100 emails/day) or we can continue using ours."),
        ("Stripe Live Mode",
         "Once the domain is active, enable live mode on your Stripe account. Requires: verified "
         "business identity (already started), custom domain, and a real bank account for payouts."),
        ("Live Environment Testing",
         "After Stripe goes live, we test the full flow with real cards and real bank accounts to "
         "verify payments, tip recording, and automatic payouts in production."),
    ]

    # Build numbered step rows (matching reference style)
    for i, (title, desc) in enumerate(actions, 1):
        num_para = Paragraph(
            f"<b>{i}</b>",
            ParagraphStyle("num", fontName="Helvetica-Bold", fontSize=11,
                           textColor=WHITE, alignment=TA_CENTER, leading=14),
        )
        title_para = Paragraph(f"<b>{title}</b>", cell_header)
        desc_para = Paragraph(desc, cell_small)
        content = Table(
            [[title_para], [desc_para]],
            colWidths=[w * 0.84],
        )
        content.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        step_table = Table([[num_para, content]], colWidths=[w * 0.07, w * 0.89])
        step_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), COPPER),
            ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
            ("VALIGN", (1, 0), (1, 0), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (0, 0), 0),
            ("RIGHTPADDING", (0, 0), (0, 0), 0),
            ("LEFTPADDING", (1, 0), (1, 0), 10),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER),
        ]))
        story.append(step_table)

    # ══════════════════════════════════════
    # 5. TEST CREDENTIALS
    # ══════════════════════════════════════
    story.append(Paragraph("5. Test Credentials (Current Test Mode)", section_heading))

    cred_data = [
        [Paragraph("<b>Tipper Card</b>", cell_header),
         Paragraph("4242 4242 4242 4242  (any expiry, any CVC)", cell_body)],
        [Paragraph("<b>Employee Bank</b>", cell_header),
         Paragraph("BSB: 110000  |  Account: 000123456  |  Name: any name", cell_body)],
    ]
    cred_table = Table(cred_data, colWidths=[w * 0.23, w * 0.77])
    cred_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CRED_BG),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
    ]))
    story.append(cred_table)

    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Note: The next testing phase requires real bank details and real bank cards. Once the "
        "domain and hosting are finalised, we will activate Stripe live mode and begin "
        "real-environment testing together.",
        note_style,
    ))

    # ── Footer ──
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=4))
    story.append(Paragraph(
        "TipUs  |  System Overview &amp; Next Steps  |  Prepared by Mukela Katungu  |  18 February 2026",
        footer_style,
    ))

    doc.build(story)
    print("PDF generated successfully.")


if __name__ == "__main__":
    build_pdf()
