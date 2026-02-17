#!/usr/bin/env python3
"""Generate TipUs client-facing status report PDF — updated 17 Feb 2026."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable,
)
from datetime import datetime

# Brand colors
CORAL = HexColor("#d4856a")
CORAL_LIGHT = HexColor("#f5e0d7")
CORAL_DARK = HexColor("#b06b52")
DARK_TEXT = HexColor("#1e293b")
MEDIUM_TEXT = HexColor("#475569")
LIGHT_TEXT = HexColor("#64748b")
GREEN = HexColor("#16a34a")
GREEN_BG = HexColor("#dcfce7")
AMBER = HexColor("#d97706")
SURFACE_100 = HexColor("#f1f5f9")
SURFACE_200 = HexColor("#e2e8f0")
WHITE = white


def build_pdf():
    output_path = "/Users/mukelakatungu/tipus/TipUs_Status_Report.pdf"
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
    )

    width = A4[0] - 5 * cm  # usable width
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle", parent=styles["Title"],
        fontName="Helvetica-Bold", fontSize=28, textColor=CORAL,
        spaceAfter=4 * mm, alignment=TA_LEFT,
    )
    subtitle_style = ParagraphStyle(
        "CustomSubtitle", parent=styles["Normal"],
        fontName="Helvetica", fontSize=12, textColor=MEDIUM_TEXT,
        spaceAfter=6 * mm,
    )
    heading_style = ParagraphStyle(
        "CustomH2", parent=styles["Heading2"],
        fontName="Helvetica-Bold", fontSize=16, textColor=CORAL_DARK,
        spaceBefore=8 * mm, spaceAfter=4 * mm,
    )
    subheading_style = ParagraphStyle(
        "CustomH3", parent=styles["Heading3"],
        fontName="Helvetica-Bold", fontSize=12, textColor=DARK_TEXT,
        spaceBefore=4 * mm, spaceAfter=2 * mm,
    )
    body_style = ParagraphStyle(
        "CustomBody", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, textColor=DARK_TEXT,
        leading=15, spaceAfter=3 * mm,
    )
    body_light = ParagraphStyle(
        "BodyLight", parent=body_style,
        textColor=MEDIUM_TEXT, fontSize=9.5,
    )
    check_style = ParagraphStyle(
        "CheckItem", parent=body_style,
        leftIndent=5 * mm, spaceAfter=2 * mm, fontSize=10, leading=14,
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=LIGHT_TEXT,
        alignment=TA_CENTER,
    )

    story = []
    date_str = "17 February 2026"

    # ─── COVER / HEADER ───
    story.append(Spacer(1, 15 * mm))
    story.append(Paragraph("TipUs", title_style))
    story.append(Paragraph("Digital Tipping Platform for Australian Hospitality", subtitle_style))
    story.append(HRFlowable(width=width, thickness=2, color=CORAL, spaceAfter=6 * mm))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(
        f'<font color="{LIGHT_TEXT.hexval()}">Project Status Report  |  {date_str}</font>',
        body_light,
    ))
    story.append(Spacer(1, 8 * mm))

    # ─── 1. EXECUTIVE SUMMARY ───
    story.append(Paragraph("1. Executive Summary", heading_style))
    story.append(Paragraph(
        "<b>TipUs</b> is a digital tipping platform designed for Australian hospitality venues. "
        "It allows customers to tip staff by scanning a QR code at a venue, selecting an amount, "
        "and paying instantly with their card or digital wallet (Apple Pay / Google Pay).",
        body_style,
    ))
    story.append(Paragraph(
        "All tip money stays on the TipUs platform. Venues never touch money or Stripe directly. "
        "At payout time, TipUs keeps a 5% platform fee and distributes 95% to employees, "
        "prorated by their active days in the period. Money goes directly to each employee's "
        "Australian bank account via Stripe.",
        body_style,
    ))

    # Status summary table
    summary_data = [
        ["Overall Completion", "~98%"],
        ["Core Features", "All implemented and tested (10 of 11 phases)"],
        ["Payment Processing", "Fully working via Stripe (platform-direct model)"],
        ["Money Flow", "100% stays on TipUs platform until payout"],
        ["Payout Safety", "Per-employee tracking prevents double-payments"],
        ["Mode", "Test mode (ready for live switch)"],
    ]
    summary_table = Table(summary_data, colWidths=[width * 0.35, width * 0.65])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), CORAL_LIGHT),
        ("BACKGROUND", (1, 0), (1, -1), SURFACE_100),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK_TEXT),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, SURFACE_200),
    ]))
    story.append(Spacer(1, 2 * mm))
    story.append(summary_table)
    story.append(Spacer(1, 6 * mm))

    # ─── 2. WHAT'S WORKING ───
    story.append(Paragraph("2. What's Working", heading_style))
    story.append(Paragraph(
        "Every core feature has been built, deployed, and tested end-to-end:",
        body_style,
    ))

    features = [
        ("Venue Owner Onboarding", "Sign up, create venue, start receiving tips immediately (no Stripe setup needed)"),
        ("Employee Management", "Add/edit/deactivate employees, send email invitations"),
        ("Employee Onboarding", "Employees receive invite, create account, enter bank details"),
        ("QR Code System", "Generate and manage QR codes per venue or per employee"),
        ("Customer Tipping", "Scan QR, choose amount, pay with card/Apple Pay/Google Pay"),
        ("Platform-Direct Payments", "100% of tips stay on TipUs platform, no venue Stripe needed"),
        ("Tip Recording", "Webhook automatically records each successful payment in the database"),
        ("Dashboard (Venue Owner)", "Overview stats, tip history with filters, employee management"),
        ("Dashboard (Employee)", "Personal stats, tip history, payout history, bank detail management"),
        ("Manual Payouts", "Calculate splits by active days, review, and execute with one click"),
        ("Automatic Payouts", "Configure weekly/fortnightly/monthly schedule, runs automatically"),
        ("Bank Transfers", "Employee payouts sent directly to their Australian bank account via Stripe"),
        ("Payout Safety", "Per-employee tracking: retry only sends to failed employees, never double-pays"),
        ("Role-Based Access", "Venue owners and employees see different dashboards"),
        ("Email System", "Invitation emails sent via Resend"),
        ("Mobile Responsive", "Full mobile experience with bottom navigation"),
        ("Security", "Row-level security, no secrets in frontend, encrypted data at rest"),
    ]

    for name, desc in features:
        story.append(Paragraph(
            f'<font color="{GREEN.hexval()}"><b>&#10003;</b></font>  '
            f'<b>{name}</b> &mdash; {desc}',
            check_style,
        ))

    story.append(PageBreak())

    # ─── 3. HOW THE MONEY FLOWS ───
    story.append(Paragraph("3. How the Money Flows", heading_style))
    story.append(Paragraph(
        "TipUs uses a <b>platform-direct</b> model: all tip money stays on the TipUs Stripe "
        "account. Venues never touch money or need to connect Stripe.",
        body_style,
    ))
    story.append(Spacer(1, 3 * mm))

    flow_steps = [
        ("1", "Customer Scans QR Code",
         "The customer scans a QR code at the venue with their phone camera."),
        ("2", "Customer Pays",
         "They choose a tip amount and pay with their card, Apple Pay, or Google Pay."),
        ("3", "Money Stays on TipUs Platform",
         "100% of the tip lands on the TipUs Stripe account. No money goes to the venue. "
         "The tip is recorded in the database automatically via webhook."),
        ("4", "Venue Owner Distributes",
         "The venue owner triggers a payout (or it runs on auto-schedule). "
         "TipUs keeps 5% and calculates each employee's share based on days worked."),
        ("5", "Money Reaches Employees",
         "Each employee's share is transferred to their bank account via Stripe. "
         "Each transfer is tracked individually with status and receipt."),
    ]

    for num, title, desc in flow_steps:
        step_data = [[
            Paragraph(
                f'<font color="{WHITE.hexval()}" size="14"><b>{num}</b></font>',
                ParagraphStyle("StepNum", alignment=TA_CENTER, fontName="Helvetica-Bold"),
            ),
            Paragraph(
                f'<b>{title}</b><br/><font size="9" color="{MEDIUM_TEXT.hexval()}">{desc}</font>',
                body_style,
            ),
        ]]
        step_table = Table(step_data, colWidths=[12 * mm, width - 14 * mm])
        step_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), CORAL),
            ("BACKGROUND", (1, 0), (1, 0), SURFACE_100),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (0, 0), 4),
            ("LEFTPADDING", (1, 0), (1, 0), 8),
        ]))
        story.append(step_table)
        story.append(Spacer(1, 2 * mm))

    story.append(Spacer(1, 4 * mm))

    # ─── 4. WHAT'S NEW: PAYOUT SAFETY ───
    story.append(Paragraph("4. What's New: Payout Safety", heading_style))
    story.append(Paragraph(
        "A critical improvement has been made to the payout system to handle partial failures safely.",
        body_style,
    ))

    story.append(Paragraph("<b>The Problem (Before)</b>", subheading_style))
    story.append(Paragraph(
        "If one employee's bank transfer failed (e.g. incorrect bank details), the entire payout "
        "was marked as \"failed\". Retrying would re-send money to <b>all</b> employees, including "
        "those already paid &mdash; risking double-payments.",
        body_style,
    ))

    story.append(Paragraph("<b>The Solution (Now)</b>", subheading_style))

    safety_items = [
        "Each employee's transfer is tracked individually (completed, failed, or pending)",
        "If some transfers succeed and others fail, the payout is marked \"partially completed\"",
        "Clicking \"Retry Failed\" only processes employees who haven't been paid yet",
        "Already-paid employees are safely skipped &mdash; no risk of double-payments",
        "Error messages are shown per-employee so you know exactly what went wrong",
        "Works the same way for both manual and automatic scheduled payouts",
    ]
    for item in safety_items:
        story.append(Paragraph(
            f'<font color="{GREEN.hexval()}"><b>&#10003;</b></font>  {item}',
            check_style,
        ))

    story.append(Spacer(1, 4 * mm))

    # ─── 5. WHAT'S REMAINING ───
    story.append(Paragraph("5. What's Remaining for Production", heading_style))
    story.append(Paragraph(
        "The platform is fully functional in <b>test mode</b>. To go live with real money:",
        body_style,
    ))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("Must Complete Before Launch", subheading_style))

    critical_items = [
        (
            "Employee Identity Verification",
            "Switch from Custom to Express Stripe accounts so Stripe handles identity "
            "verification directly. Currently uses placeholder data for test mode.",
        ),
        (
            "Switch to Stripe Live Mode",
            "Replace test API keys with live keys. Create a new live webhook. "
            "Redeploy all backend functions.",
        ),
        (
            "Stripe Account Verification",
            "Verify the Stripe account with real business details: ABN, address, "
            "and connected bank account.",
        ),
        (
            "Custom Domain + Security",
            "Set up a production domain (e.g. app.tipus.com.au). Restrict backend "
            "to only accept requests from this domain.",
        ),
    ]

    for title, desc in critical_items:
        story.append(Paragraph(
            f'<font color="{AMBER.hexval()}"><b>&#9679;</b></font>  <b>{title}</b>',
            ParagraphStyle("CritItem", parent=body_style, spaceAfter=1 * mm),
        ))
        story.append(Paragraph(
            desc,
            ParagraphStyle("CritDesc", parent=body_light, leftIndent=7 * mm, spaceAfter=4 * mm),
        ))

    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Nice to Have (After Launch)", subheading_style))

    nice_items = [
        "Analytics dashboard with charts and trends",
        "Bulk employee invite (add multiple employees at once)",
        "Email notifications when payouts are processed",
    ]
    for item in nice_items:
        story.append(Paragraph(
            f'<font color="{LIGHT_TEXT.hexval()}">&#9675;</font>  {item}',
            check_style,
        ))

    story.append(PageBreak())

    # ─── 6. NEXT STEPS ───
    story.append(Paragraph("6. Next Steps", heading_style))
    story.append(Paragraph(
        "Here is the recommended order of actions to bring TipUs live:",
        body_style,
    ))
    story.append(Spacer(1, 3 * mm))

    next_steps = [
        ("Complete Stripe account setup", "Verify business details, enable Connect, complete platform profile"),
        ("Switch employees to Express accounts", "Let Stripe handle identity verification (recommended approach)"),
        ("Register production domain", "Set up app.tipus.com.au or similar, configure SSL"),
        ("Switch to live Stripe keys", "Update all environment variables and redeploy backend functions"),
        ("Configure live webhook", "New endpoint in Stripe Dashboard for production"),
        ("Test with a real payment", "Make a small real tip ($1) and verify the full flow end-to-end"),
        ("Monitor for 24-48 hours", "Watch Stripe Dashboard and database logs for any issues"),
        ("Launch", "Share QR codes with venues and start accepting real tips"),
    ]

    for i, (title, desc) in enumerate(next_steps, 1):
        step_data = [[
            Paragraph(
                f'<font size="10"><b>{i}</b></font>',
                ParagraphStyle("Num", alignment=TA_CENTER, fontName="Helvetica-Bold", textColor=CORAL),
            ),
            Paragraph(
                f'<b>{title}</b><br/><font size="9" color="{MEDIUM_TEXT.hexval()}">{desc}</font>',
                body_style,
            ),
        ]]
        step_table = Table(step_data, colWidths=[10 * mm, width - 12 * mm])
        step_table.setStyle(TableStyle([
            ("BACKGROUND", (1, 0), (1, 0), SURFACE_100),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (1, 0), (1, 0), 8),
        ]))
        story.append(step_table)
        story.append(Spacer(1, 1 * mm))

    # ─── TECH OVERVIEW ───
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("7. Technical Overview", heading_style))

    tech_data = [
        ["Component", "Technology"],
        ["Frontend", "React 19, TypeScript 5.9, Tailwind CSS 4"],
        ["Backend", "Supabase (PostgreSQL, Auth, Edge Functions)"],
        ["Payments", "Stripe (Platform-Direct + Custom accounts for employees)"],
        ["Email", "Resend (transactional email service)"],
        ["Hosting", "Netlify (frontend) + Supabase (backend)"],
        ["Security", "Row-level security, encrypted at rest, role-based access"],
        ["Build Size", "~210KB gzipped (production-optimized)"],
    ]
    tech_table = Table(tech_data, colWidths=[width * 0.3, width * 0.7])
    tech_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), CORAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 1), (-1, -1), SURFACE_100),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, SURFACE_200),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK_TEXT),
    ]))
    story.append(tech_table)

    # ─── FOOTER ───
    story.append(Spacer(1, 15 * mm))
    story.append(HRFlowable(width=width, thickness=1, color=SURFACE_200, spaceAfter=4 * mm))
    story.append(Paragraph(
        f"TipUs Status Report  |  {date_str}  |  Confidential",
        footer_style,
    ))

    # Build
    doc.build(story)
    print(f"PDF saved to {output_path}")


if __name__ == "__main__":
    build_pdf()
