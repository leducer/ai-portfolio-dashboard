import os
from io import BytesIO
from PIL import Image as PILImage, ImageDraw
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def make_circular_avatar(image_path, diameter=76, supersample=4):
    """Lädt ein Bild, schneidet es quadratisch-zentriert zu und maskiert es
    zu einem perfekten, kantengeglätteten Kreis. Gibt einen PNG-Bytebuffer zurück."""
    hi_res = diameter * supersample
    
    img = PILImage.open(image_path).convert("RGBA")
    
    # Zentrierter Zuschnitt auf ein perfektes Quadrat, um Verzerrungen zu vermeiden
    w, h = img.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 3.3
    img = img.crop((left, top, left + side, top + side)).resize((hi_res, hi_res), PILImage.LANCZOS)
    
    # Runde Maske in hoher Auflösung, dann herunterskaliert -> weiche, glatte Kante
    mask = PILImage.new("L", (hi_res, hi_res), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, hi_res, hi_res), fill=255)
    
    circular = PILImage.new("RGBA", (hi_res, hi_res), (0, 0, 0, 0))
    circular.paste(img, (0, 0), mask)
    circular = circular.resize((diameter, diameter), PILImage.LANCZOS)
    
    buffer = BytesIO()
    circular.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def create_cv():
    pdf_path = "public/cv-daSilvaLe.pdf"
    os.makedirs("public", exist_ok=True)
    
    # Seiteneinstellungen: 40pt Margins für ein luftiges, lesbares Layout
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # ─── DESIGN-STYLES (OHNE AGGRESSIVE RAHMEN) ──────────────────────────
    title_style = ParagraphStyle(
        'CVTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=24, leading=28,
        textColor=colors.HexColor('#0a0b0d'), spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'CVSubtitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=12, leading=16,
        textColor=colors.HexColor('#0055ff'), spaceAfter=8
    )
    
    header_contact = ParagraphStyle(
        'CVContact', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.5, leading=14,
        textColor=colors.HexColor('#4b5563'), spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        'CVSection', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=13, leading=17,
        textColor=colors.HexColor('#0a0b0d'), spaceBefore=12, spaceAfter=2
    )
    
    body_style = ParagraphStyle(
        'CVBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9.5, leading=14,
        textColor=colors.HexColor('#374151'), spaceAfter=4
    )

    # Styles für die bündige 2-Spalten-Tabelle (Links Inhalt, Rechts Datum)
    table_left_title = ParagraphStyle(
        'CVTableLeftTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=colors.HexColor('#111827')
    )
    
    table_right_meta = ParagraphStyle(
        'CVTableRightMeta', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=14,
        textColor=colors.HexColor('#4b5563'), alignment=2 # Rechtsbündig
    )

    story = []
    
    # ─── HEADER (NAME, STATUS & PROFILBILD) ──────────────────────────────
    contact_text = (
        "<b>Mobil:</b> +49 173 2611236  |  <b>E-Mail:</b> leducer@gmail.com  |  <b>Ort:</b> 50969 Köln<br/>"
        "<b>GitHub:</b> https://github.com/leducer |  <b>Live AI-Interface:</b> leducer.space"
    )
    
    AVATAR_DIAMETER = 76  # pt, innerhalb der geforderten 70-80pt
    avatar_path = "public/avatar.png"
    
    header_left = [
        Paragraph("CANH VIET-DUC DA SILVA LE", title_style),
        Paragraph("Senior Frontend Engineer & AI-Native Architect — Sofort in Vollzeit verfügbar", subtitle_style),
        Paragraph(contact_text, header_contact),
    ]
    
    if os.path.exists(avatar_path):
        avatar_buffer = make_circular_avatar(avatar_path, diameter=AVATAR_DIAMETER)
        avatar_image = Image(avatar_buffer, width=AVATAR_DIAMETER, height=AVATAR_DIAMETER)
        avatar_image.hAlign = 'CENTER'
        header_right = [avatar_image]
    else:
        header_right = [Spacer(1, AVATAR_DIAMETER)]
    
    # Feinjustierung: Profilbild um 0,5cm gegenüber der reinen Mittelachse nach oben verschieben
    AVATAR_UP_SHIFT = 0.5 * cm
    
    header_table = Table([[header_left, header_right]], colWidths=[410, 80])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        # Nur auf der Bild-Zelle: zusätzliches Bottom-Padding verschiebt das
        # innerhalb der MIDDLE-Ausrichtung zentrierte Bild um AVATAR_UP_SHIFT nach oben
        ('BOTTOMPADDING', (1, 0), (1, 0), AVATAR_UP_SHIFT * 2),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))
    
    # ─── PROFIL ──────────────────────────────────────────────────────────
    story.append(Paragraph("PROFIL", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb'), spaceAfter=6))
    story.append(Paragraph(
        "Erfahrener Senior Frontend Engineer mit über 10 Jahren tiefgehender Praxis in der Entwicklung hochperformanter, "
        "skalierbarer und barrierefreier Web-Architekturen. Experte für den systematischen Aufbau von Enterprise Pattern "
        "Libraries nach strikten Atomic-Design-Prinzipien. Spezialisiert auf modernste AI-Native Entwicklung, "
        "LLM-Frontendschnittstellen, Echtzeit-Datenstreaming und hocheffiziente serverlose Performance-Infrastrukturen.", 
        body_style
    ))
    
    # ─── EXPERTISE & SKILLS ──────────────────────────────────────────────
    story.append(Paragraph("EXPERTISE & SKILLS", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb'), spaceAfter=6))
    
    skills_text = (
        "<b>Core Frontend:</b> React.js, Next.js (App Router), TypeScript, JavaScript (ES6+), Vue.js, AngularJS<br/>"
        "<b>Styling & Arch.:</b> Tailwind CSS v4 (CSS-First), Styled Components, Emotion CSS, SCSS, Atomic Design, Storybook<br/>"
        "<b>AI Engineering:</b> Vercel AI SDK v4, Google Gemini API, OpenAI API, Core-Modell Orchestrierung, AI Tool-Calling<br/>"
        "<b>Backend & Infra:</b> Node.js, Supabase (PostgreSQL), REST APIs, Swagger, Serverless In-Memory Caching, Edge Runtime<br/>"
        "<b>QA & Tools:</b> Cypress, Playwright, Jest, Jasmine, Git, Scrum, Jira, Figma, Claude Code, GitHub Copilot<br/>"
        "<b>Sprachen:</b> Deutsch (Muttersprache / Fließend), Englisch, Vietnamesisch"
    )
    story.append(Paragraph(skills_text, body_style))
    
    # ─── AI-HIGHLIGHT PROJEKT ────────────────────────────────────────────
    story.append(Paragraph("AI-HIGHLIGHT PROJEKT (PRODUKTIVSYSTEM)", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb'), spaceAfter=6))
    
    story.append(Paragraph("<b>Agentic Voice-Driven Interface (leducer.space) — Eigenkonzeption & Live-System</b>", table_left_title))
    project_bullets = (
        "• Entwicklung einer autonomen KI-Anwendung mit integriertem Vercel AI SDK v4 für unblockiertes Echtzeit-Textstreaming via Gemini 3.6 Flash.<br/>"
        "• Implementierung eines serverseitigen In-Memory Performance Caches mit Supabase zur Eliminierung von PostgreSQL TCP-Verbindungslatenzen von Sekunden auf unter 200 Millisekunden.<br/>"
        "• Aufbau eines vollständig barrierefreien, multimodalen Voice-Interfaces unter direkter Nutzung der nativen Web Speech API für Speech-to-Text und Text-to-Speech.<br/>"
        "• Konzeption von KI Tool-Calling-Mechanismen (Function Calling), wodurch das LLM zur Laufzeit autonom JavaScript-Aktionen ausführt, um interaktive UI-Komponenten dynamisch im Chat-Protokoll zu rendern."
    )
    story.append(Paragraph(project_bullets, body_style))
    
    # ─── BERUFLICHE STATIONEN ────────────────────────────────────────────
    story.append(Paragraph("BERUFLICHE STATIONEN (FREELANCER SEIT 2015)", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb'), spaceAfter=6))
    
    # --- NEXUM AG ---
    row_nexum = [
        Paragraph("NEXUM AG — Senior Frontend Engineer", table_left_title),
        Paragraph("04/2019 – 03/2022<br/>& 02/2023 – 04/2026", table_right_meta)
    ]
    t_nexum = Table([row_nexum], colWidths=[380, 152])
    t_nexum.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t_nexum)
    
    nexum_bullets = (
        "• <b>Projekt Ex Libris AG (exlibris.ch):</b> Architektureller Auf- und Ausbau kritischer E-Commerce-Komponenten und Webservice-Anbindungen. Signifikante Steigerung der Conversion-Rate durch drastische Reduktion der Initial-Load-Time mittels strukturiertem Code-Splitting, Code-Reviews und modernem Lazy-Loading. Etablierung AI-gestützter Entwicklungsprozesse (Claude Code, Copilot).<br/>"
        "• <b>Projekt Melitta / Avoury:</b> Full-Ownership bei der Konzeption, Entwicklung und skalierbaren Pflege einer zentralen Enterprise Pattern Library nach präzisen Atomic-Design-Metriken im Verbund mit Storybook.<br/>"
        "• <b>Projekt Cosnova / Catrice:</b> Modulare Core-Frontend-Entwicklung wiederverwendbarer UI-Bausteine innerhalb einer globalen UI-Bibliothek.<br/>"
        "<b>Tech Stack:</b> React.js, Next.js, TypeScript, MobX, Styled Components, Storybook, Atomic Design, Node.js, Jest, Playwright, Cypress, Claude Code, Redis, REST API, Figma"
    )
    story.append(Paragraph(nexum_bullets, body_style))
    story.append(Spacer(1, 6))
    
    # --- MABACH GMBH ---
    row_mabach = [
        Paragraph("MABACH GMBH — Frontend Architekt", table_left_title),
        Paragraph("04/2022 – 09/2022<br/>& 04/2023 – 06/2023", table_right_meta)
    ]
    t_mabach = Table([row_mabach], colWidths=[380, 152])
    t_mabach.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t_mabach)
    
    mabach_bullets = (
        "• Kern-Weiterentwicklung und Performance-Optimierung der reichweitenstarken Plattform Unterkunft.de.<br/>"
        "• Konzeption modularer Core-Features mit Fokus auf reibungslose State-Architekturen und optimierte Server-Side-Rendervorgänge.<br/>"
        "<b>Tech Stack:</b> React.js, Next.js, TypeScript, Emotion CSS, Storybook, Node.js, REST API"
    )
    story.append(Paragraph(mabach_bullets, body_style))
    story.append(Spacer(1, 6))
    
    # --- TRACK GMBH ---
    row_track = [
        Paragraph("TRACK GMBH — Senior UI Engineer", table_left_title),
        Paragraph("10/2022 – 12/2022", table_right_meta)
    ]
    t_track = Table([row_track], colWidths=[380, 152])
    t_track.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t_track)
    
    track_bullets = (
        "• Greenfield-Konzeption und Umsetzung einer skalierbaren, hochkompatiblen Pattern Library für alphabet.com unter strikter Einhaltung von Design-Token-Spezifikationen.<br/>"
        "<b>Tech Stack:</b> React.js, Next.js, TypeScript, Storybook, SCSS"
    )
    story.append(Paragraph(track_bullets, body_style))
    story.append(Spacer(1, 6))
    
    # --- SEVENVAL ---
    row_sevenval = [
        Paragraph("SEVENVAL TECHNOLOGIES GMBH — Frontend Developer", table_left_title),
        Paragraph("12/2018 – 03/2019", table_right_meta)
    ]
    t_sevenval = Table([row_sevenval], colWidths=[380, 152])
    t_sevenval.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t_sevenval)
    
    sevenval_bullets = (
        "• Entwicklung und Pflege responsiver Enterprise-Frontends für Multi-Device-Kunden auf Basis der proprietären Rendering-Plattform.<br/>"
        "• Enge Abstimmung mit Backend-Teams zur Sicherstellung konsistenter Kompatibilität über heterogene Endgeräte hinweg.<br/>"
        "<b>Tech Stack:</b> JavaScript, HTML5, CSS3, jQuery, REST API"
    )
    story.append(Paragraph(sevenval_bullets, body_style))
    story.append(Spacer(1, 6))
    
    # --- INTERLUTIONS GMBH ---
    row_interlutions = [
        Paragraph("INTERLUTIONS GMBH — Frontend Developer (Festanstellung)", table_left_title),
        Paragraph("2014 – 2015", table_right_meta)
    ]
    t_interlutions = Table([row_interlutions], colWidths=[380, 152])
    t_interlutions.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t_interlutions)
    
    interlutions_bullets = (
        "• Frontend-Architektur und Feature-Entwicklung für Großkunden wie Disney Channel, Nintendo und Docuscan."
    )
    story.append(Paragraph(interlutions_bullets, body_style))
    story.append(Spacer(1, 6))
    
    # --- M.I.R MEDIA ---
    row_mir = [
        Paragraph("M.I.R MEDIA — Frontend Developer (Festanstellung)", table_left_title),
        Paragraph("2011 – 2014", table_right_meta)
    ]
    t_mir = Table([row_mir], colWidths=[380, 152])
    t_mir.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)]))
    story.append(t_mir)
    
    mir_bullets = (
        "• Konzeption und agile Web-Entwicklung interaktiver Portale für das Konzerthaus Dortmund, Rimowa und das Augencentrum Aachen."
    )
    story.append(Paragraph(mir_bullets, body_style))
    
    # ─── BILDUNGSWEG ──────────────────────────────────────────────────────
    story.append(Paragraph("BILDUNGSWEG", section_heading))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb'), spaceAfter=6))
    story.append(Paragraph(
        "• <b>Bachelorstudium Computer Science</b> (nicht abgeschlossen) – FH Bonn-Rhein-Sieg (2004 - 2007)<br/>"
        "• <b>Fachhochschulreife: Gestaltungstechnischer Assistent</b> – Richard-Riemerschmid-Berufskolleg Köln (2001 - 2004)",
        body_style
    ))

    doc.build(story)

if __name__ == '__main__':
    create_cv()
