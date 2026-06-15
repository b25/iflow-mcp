import os
import sys
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class IFlowMCPDoc(FPDF):
    def __init__(self):
        super().__init__(orientation="portrait", format="A4")
        self.in_cover_page = True
        
        # Culorile brandului iFlow
        self.c_primary = (11, 37, 69)      # Navy Blue închis
        self.c_secondary = (19, 99, 223)   # Teal/Albastru intens
        self.c_accent = (0, 180, 216)      # Bleu vibrant
        self.c_neutral_dark = (31, 41, 55) # Charcoal
        self.c_neutral_light = (243, 244, 246) # Gri foarte deschis
        self.c_white = (255, 255, 255)
        self.c_muted = (107, 114, 128)     # Gri mediu/mut
        
        # Adăugare fonturi de sistem macOS care suportă diacritice în format unicode
        self.add_font("Arial", "", "/System/Library/Fonts/Supplemental/Arial.ttf")
        self.add_font("Arial", "B", "/System/Library/Fonts/Supplemental/Arial Bold.ttf")
        self.add_font("Georgia", "", "/System/Library/Fonts/Supplemental/Georgia.ttf")
        self.add_font("Georgia", "B", "/System/Library/Fonts/Supplemental/Georgia Bold.ttf")
        
        # Setare margini standard
        self.set_margins(20, 25, 20)
        self.set_auto_page_break(True, margin=20)

    def header(self):
        if self.in_cover_page:
            return
        
        # Linie decorativă superioară
        self.set_fill_color(*self.c_primary)
        self.rect(20, 10, 170, 3, "F")
        
        # Text header
        self.set_font("Arial", "", 8)
        self.set_text_color(*self.c_muted)
        self.cell(0, 5, "INTEGRARE INTELIGENȚĂ ARTIFICIALĂ — iFlow ERP MCP SERVER", 
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        self.ln(10)

    def footer(self):
        if self.in_cover_page:
            return
        
        # Linie de demarcație
        self.set_draw_color(*self.c_neutral_light)
        self.line(20, 280, 190, 280)
        
        # Poziționare footer
        self.set_y(-15)
        self.set_font("Arial", "", 8)
        self.set_text_color(*self.c_muted)
        
        # Stânga: Confidențialitate
        self.cell(100, 10, "Documentație Tehnică Oficială iFlow ERP. Toate drepturile rezervate.", align="L")
        # Dreapta: Număr pagină
        self.cell(0, 10, f"Pagina {self.page_no()}", align="R")

    def draw_section_header(self, title, category="CAPITOLUL"):
        self.ln(5)
        self.set_font("Arial", "B", 9)
        self.set_text_color(*self.c_secondary)
        self.cell(0, 5, category.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("Georgia", "B", 18)
        self.set_text_color(*self.c_primary)
        self.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Linie sub titlu
        self.set_fill_color(*self.c_accent)
        self.rect(self.get_x(), self.get_y(), 40, 2, "F")
        self.ln(8)

    def draw_tool_card(self, name, scope, desc, examples=None):
        self.set_font("Arial", "B", 10.5)
        self.set_text_color(*self.c_primary)
        
        # Fundal deschis pentru numele tool-ului
        self.set_fill_color(*self.c_neutral_light)
        self.cell(0, 7, f"  INSTRUMENT: {name}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        
        self.set_font("Arial", "", 8.5)
        self.set_text_color(*self.c_muted)
        self.cell(0, 5, f"   Domeniu de securitate (Scope): {scope}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.ln(1)
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        
        # Descriere multi-linie
        self.multi_cell(0, 5, desc)
        
        if examples:
            self.ln(1)
            self.set_font("Arial", "", 9)
            self.set_text_color(*self.c_secondary)
            self.multi_cell(0, 4, f"   Exemplu utilizare: {examples}")
        
        self.ln(4)

    def create_cover_page(self):
        self.add_page()
        self.in_cover_page = True
        
        # Fundal decorativ pe lateral stânga
        self.set_fill_color(*self.c_primary)
        self.rect(0, 0, 15, 297, "F")
        
        # Fundal decorativ pe lateral accent
        self.set_fill_color(*self.c_secondary)
        self.rect(15, 0, 5, 297, "F")
        
        # Logo text elegant
        self.set_xy(30, 40)
        self.set_font("Georgia", "B", 24)
        self.set_text_color(*self.c_secondary)
        self.cell(0, 10, "iFlow ERP", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_muted)
        self.cell(0, 5, "INTEGRARE INTELIGENȚĂ ARTIFICIALĂ PRIN MODEL CONTEXT PROTOCOL (MCP)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Titlu principal
        self.set_xy(30, 100)
        self.set_font("Georgia", "B", 36)
        self.set_text_color(*self.c_primary)
        self.multi_cell(0, 14, "Catalogul de\nInstrumente MCP")
        
        # Subtitlu
        self.ln(5)
        self.set_x(30)
        self.set_font("Arial", "", 14)
        self.set_text_color(*self.c_neutral_dark)
        self.multi_cell(0, 7, "Manual Tehnic Complet și Prezentare Profesională a Serviciilor AI de Interogare și Automatizare iFlow")
        
        # Linie de accent
        self.ln(10)
        self.set_x(30)
        self.set_fill_color(*self.c_accent)
        self.rect(30, self.get_y(), 60, 4, "F")
        
        # Detalii emitent și dată în partea de jos
        self.set_xy(30, 220)
        self.set_font("Arial", "B", 10)
        self.set_text_color(*self.c_primary)
        self.cell(0, 5, "PROIECT:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        self.cell(0, 5, "Server MCP iFlow (Sistem de Corelație și Operare Automatizată)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.ln(4)
        self.set_x(30)
        self.set_font("Arial", "B", 10)
        self.set_text_color(*self.c_primary)
        self.cell(0, 5, "DOCUMENT:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        self.cell(0, 5, "Catalogul Oficial de Instrumente, Securitate și Reguli de Chat", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.ln(4)
        self.set_x(30)
        self.set_font("Arial", "B", 10)
        self.set_text_color(*self.c_primary)
        self.cell(0, 5, "DATĂ & VERSIUNE:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        self.cell(0, 5, "Iunie 2026 | Versiunea 1.2.0 (Producție)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def write_introduction_page(self):
        self.add_page()
        self.in_cover_page = False
        
        self.draw_section_header("Introducere în iFlow MCP", "CAPITOLUL 1")
        
        self.set_font("Arial", "", 10.5)
        self.set_text_color(*self.c_neutral_dark)
        
        # Paragraf introductiv
        p1 = (
            "Model Context Protocol (MCP) reprezintă un standard deschis, dezvoltat "
            "pentru a permite asistenților inteligenți (precum Cursor, Claude Desktop, Gemini sau ChatGPT) "
            "să interacționeze în mod securizat, structurat și contextualizat cu sursele de date externe "
            "și API-urile locale sau la distanță. Serverul iflows-mcp servește ca o punte bidirecțională directă "
            "între nucleul ERP iFlow și modelele LLM utilizate de inginerii sau decidenții companiei."
        )
        self.multi_cell(0, 6, p1)
        self.ln(4)
        
        p2 = (
            "Prin implementarea acestui protocol, asistentul AI nu mai lucrează cu informații inventate sau "
            "învechite, ci are capacitatea de a lansa interogări dinamice în timp real pe baza contextului "
            "discuției. Serverul este optimizat pentru a proteja integritatea datelor comerciale, implementând "
            "semantici stricte de securitate prin token-uri Bearer, permisiuni bazate pe domenii (OAuth Scopes) "
            "și un sistem riguros de validare în doi pași pentru scrieri (Two-Phase Confirmation)."
        )
        self.multi_cell(0, 6, p2)
        self.ln(6)
        
        # Sub-secțiune: Valoarea de Business
        self.set_font("Georgia", "B", 14)
        self.set_text_color(*self.c_primary)
        self.cell(0, 8, "Valoarea Strategică pentru Organizație", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_fill_color(*self.c_accent)
        self.rect(self.get_x(), self.get_y(), 20, 1.5, "F")
        self.ln(4)
        
        # Card de evidențiere (Callout box)
        self.set_fill_color(*self.c_neutral_light)
        self.set_draw_color(*self.c_secondary)
        
        # Păstrăm Y-ul de start
        start_y = self.get_y()
        self.set_xy(25, start_y + 2)
        
        self.set_font("Arial", "B", 10)
        self.set_text_color(*self.c_secondary)
        self.cell(0, 5, "Beneficiile Cheie ale Integrării iFlow MCP:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_font("Arial", "", 9.5)
        self.set_text_color(*self.c_neutral_dark)
        bullets = [
            "- Eliminarea completă a halucinațiilor comerciale - asistentul folosește exclusiv date din baza ERP.",
            "- Acces instantaneu la diagnoze avansate ('Unde pierdem bani?' sau 'De ce nu mai merge ca înainte?').",
            "- Securitate nativă - tranzacțiile sensibile necesită confirmări explicite și auditarea automată a acțiunilor.",
            "- Eficiență operațională - reducerea timpilor de interogare manuală în tabele Excel sau module multiple ERP.",
            "- Planificare dinamică - abilitatea de a genera planuri secvențiale de investigație pe baza limbajului natural."
        ]
        
        for bullet in bullets:
            self.set_x(25)
            self.multi_cell(0, 5, bullet)
            
        # Desenare dreptunghi decorativ în jurul bullet-urilor
        end_y = self.get_y()
        self.rect(20, start_y, 170, end_y - start_y + 2)
        self.set_xy(20, end_y + 5)

    def write_virtual_assistant_page(self):
        self.add_page()
        self.draw_section_header("Fluxul Asistentului Virtual (Meta-Tools)", "CAPITOLUL 2")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Aceste instrumente coordonează fluxul conversațional dintre utilizator și modelele LLM. "
            "Ele transformă agentul simplu de chat într-un consultant ghidat care planifică activitățile, "
            "explică ce date deține și formulează clar întrebările înainte de a interoga baza de date."
        )
        self.multi_cell(0, 5, intro)
        self.ln(6)
        
        # 1. mcp_assistant_intro
        self.draw_tool_card(
            "mcp_assistant_intro",
            "tools:erp:read",
            "Oferă o introducere completă asupra capabilităților sistemului, afișând subiectele de business suportate, "
            "cum ar fi comenzile în desfășurare, analiza de risc sau fluxurile de lucru, alături de o listă a celor mai "
            "frecvente întrebări la care poate răspunde.",
            "Utilizatorul întreabă: 'Ce poți face pentru mine?' sau se începe o sesiune nouă."
        )
        
        # 2. mcp_data_dictionary
        self.draw_tool_card(
            "mcp_data_dictionary",
            "tools:erp:read",
            "Dicționarul de Date. Permite asistentului să descopere schema internă, tabelele, câmpurile cheie și enum-urile "
            "pe baza cărora funcționează rapoartele. Util înaintea aplicării de filtre avansate pentru a asigura corectitudinea interogării.",
            "Asistentul vrea să știe ce stadii valide are o comandă (status_orders) sau ce tipuri de parteneri există."
        )
        
        # 3. mcp_clarify
        self.draw_tool_card(
            "mcp_clarify",
            "tools:erp:read",
            "Primește obiectivul brut de business al utilizatorului și analizează dacă este nevoie de informații suplimentare. "
            "Returnează o listă de întrebări structurate cu opțiuni multiple sau text liber pentru a rafina filtrele.",
            "Utilizatorul spune: 'Arată-mi vânzările'. Tool-ul întreabă: pentru ce interval de timp? ce departament? etc."
        )
        
        # 4. mcp_plan
        self.draw_tool_card(
            "mcp_plan",
            "tools:erp:read",
            "Generează un plan secvențial de acțiune (plan executabil). Analizează obiectivul final combinat cu răspunsurile "
            "la întrebările de clarificare și ordonează apelurile de tool-uri necesare pentru a obține rezultatul corect.",
            "Se transformă un plan complex precum 'Comparația marjelor clienților de top pe ultimii 2 ani' în pași clari."
        )

    def write_listings_page(self):
        self.add_page()
        self.draw_section_header("Căutări și Listări Parametrizate (Phase 1.2 & Lookups)", "CAPITOLUL 3")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Aceste instrumente permit extragerea și filtrarea riguroasă a datelor operaționale direct din ERP. "
            "Spre deosebire de simplele puncte de acces, acestea acceptă parametri avansați: limite (limit), offset, "
            "filtre temporale (from/to), filtre de stadiu și căutări textuale (q) pe mai multe coloane."
        )
        self.multi_cell(0, 5, intro)
        self.ln(5)
        
        # Listări parametrizate mari
        self.draw_tool_card(
            "list_orders  /  list_offers  /  list_invoices",
            "tools:erp:read",
            "Permit listarea și filtrarea avansată a comenzilor de la clienți, a ofertelor comerciale create sau a facturilor emise. "
            "Returnează rezultate paginate împreună cu numărul total de elemente din bază, stările curente și filtrele aplicate.",
            "list_orders(finished=False, limit=10, order_by='date_order_desc') - Ultimele 10 comenzi nefinalizate."
        )
        
        self.draw_tool_card(
            "list_clients_search  /  list_products_search",
            "tools:erp:read",
            "Motoare de căutare textuale rapide pentru catalogul de clienți sau produse. Acceptă un argument de interogare "
            "care caută în denumiri, coduri SKU, numere de telefon sau coduri fiscale, oferind rezultate relevante instant.",
            "list_products_search(q='plăci aluminiu', limit=5) - Căutare rapidă după produse."
        )
        
        self.draw_tool_card(
            "list_purchases  /  list_stock_movements  /  list_activity",
            "tools:erp:read",
            "Urmăresc lanțul de aprovizionare și logistică. list_purchases listează comenzile trimise către furnizori, "
            "list_stock_movements afișează intrările și ieșirile de stoc, iar list_activity ține evidența istoricului operațional zilnic.",
            "list_stock_movements(product_id=1054, limit=20) - Fișa de magazie digitală a unui produs."
        )
        
        self.draw_tool_card(
            "list_notes  /  list_comments  /  list_partners",
            "tools:erp:read",
            "Permit accesarea comentariilor de pe oferte, a notițelor comerciale de pe fișele clienților sau vizualizarea "
            "tuturor partenerilor comerciali înregistrați în baza iFlow ERP.",
            "list_comments(offer_id=452) - Notele de negociere pentru oferta respectivă."
        )

    def write_operations_page(self):
        self.add_page()
        self.draw_section_header("Operațiuni Curente și Gestiune Fluxuri (Operations)", "CAPITOLUL 4")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Gestiunea activității zilnice implică monitorizarea continuă a fluxurilor de lucru (workflows), "
            "a blocajelor apărute în producție sau livrare, a productivității angajaților și a resurselor "
            "critice de producție. Aceste instrumente oferă vizibilitate în procesele active."
        )
        self.multi_cell(0, 5, intro)
        self.ln(5)
        
        # Tools
        self.draw_tool_card(
            "orders_by_stage  /  orders_flow_stage_report",
            "tools:erp:read",
            "Raportează distribuția numerică și valorică a comenzilor pe fiecare stadiu din fluxul de producție definit. "
            "Utile pentru a vedea instant unde se aglomerează comenzile și unde există blocaje de capacitate.",
            "orders_by_stage() - Situația centralizată pe departamente."
        )
        
        self.draw_tool_card(
            "order_delay_diagnosis",
            "tools:erp:read",
            "Diagnostichează întârzierile pentru o comandă specifică. Analizează istoricul tranzițiilor între etape și estimează "
            "dacă întârzierea se datorează producției, lipsei de stoc, logisticii sau aprobărilor administrative.",
            "order_delay_diagnosis(order_id=891) - Fișa detaliată a blocajului."
        )
        
        self.draw_tool_card(
            "list_work_flows  /  list_flow_stages  /  list_user_departments",
            "tools:erp:read",
            "Interoghează structura organizațională și regulile de business: fluxurile de lucru active în firmă, "
            "etapele specifice fiecărui flux și departamentele de utilizatori implicate în fluxuri.",
            "Vizualizarea modului în care o comandă trece de la departamentul Vânzări la Producție și Livrare."
        )
        
        self.draw_tool_card(
            "hours_worked_per_employee  /  daily_activity_summary",
            "tools:erp:read",
            "Instrumente de resurse umane și audit intern. Raportează numărul de ore lucrate de fiecare angajat în perioada "
            "selectată și oferă un rezumat consolidat al activităților operaționale pentru ziua în curs.",
            "daily_activity_summary(date='2026-06-01') - Auditul operațiunilor de astăzi."
        )

    def write_analyst_page(self):
        self.add_page()
        self.draw_section_header("Analize Financiare și Diagnostic de Business", "CAPITOLUL 5")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Acestea sunt instrumentele de inteligență artificială avansată destinate analiștilor financiari și directori. "
            "Sunt capabile să ruleze corelații complexe, să compare metrici față de perioade de referință (baseline) "
            "și să aplice algoritmi de igienă statistică (ex. ignorarea eșantioanelor sub 10 cazuri)."
        )
        self.multi_cell(0, 5, intro)
        self.ln(5)
        
        # Tools
        self.draw_tool_card(
            "where_are_we_losing_money",
            "tools:analytics:read",
            "Orchestratorul principal pentru pierderile financiare. Rulează o scanare simultană pe toate cele 8 perspective "
            "analitice și returnează un raport centralizat al zonelor în care compania înregistrează pierderi (marje negative, "
            "stocuri nevândute, devieri de preț de la furnizori, ineficiențe în livrare).",
            "where_are_we_losing_money(language='ro') - Scanare globală de eficiență."
        )
        
        self.draw_tool_card(
            "diff_diagnose",
            "tools:analytics:read",
            "Diagnostic comparativ extrem de avansat. Analizează evoluția unei metrici specifice (ex: profitul net, rata de conversie, "
            "valoarea medie a comenzii) între o perioadă de analiză și un baseline, identificând cauzele statistice primare ale variației.",
            "diff_diagnose(metric='profit', baseline='previous_month') - De ce a scăzut sau a crescut profitul."
        )
        
        # Cele 8 perspective
        self.set_font("Georgia", "B", 12)
        self.set_text_color(*self.c_primary)
        self.cell(0, 7, "Cele 8 Perspective Analitice Integrate (Scenariul 1):", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)
        
        perspectives = [
            ("1. Pierderi de execuție", "analyze_execution_loss - Întârzieri la livrare, comenzi anulate, retururi costisitoare."),
            ("2. Pâlnia de vânzări", "analyze_sales_funnel - Rate de conversie scăzute pe agenți, oferte nefinalizate."),
            ("3. Risc creanțe client", "analyze_receivables_risk - Clienți cu sold depășit și facturi cu scadență foarte mare."),
            ("4. Sănătatea stocurilor", "analyze_stock_health - Produse fără mișcare în depozit, costuri de stocare mari."),
            ("5. Derivă furnizori", "analyze_supplier_drift - Creșteri nejustificate ale prețurilor de achiziție de la parteneri."),
            ("6. Eficiența fluxului", "analyze_workflow_efficiency - Timpi mari de așteptare între etapele de producție."),
            ("7. Portofoliu clienți", "analyze_customer_health - Clienți istorici care și-au redus volumul de achiziții."),
            ("8. Costuri de corecție", "analyze_correction_costs - Comenzi care au necesitat refaceri în producție sau discounturi post-vânzare.")
        ]
        
        self.set_font("Arial", "", 9.5)
        for num, desc in perspectives:
            self.set_text_color(*self.c_secondary)
            self.set_font("Arial", "B", 9.5)
            self.cell(45, 5, f"   {num}:", align="L")
            self.set_text_color(*self.c_neutral_dark)
            self.set_font("Arial", "", 9.5)
            self.multi_cell(0, 5, desc)
            self.ln(1)

    def write_operational_risk_page(self):
        self.add_page()
        self.draw_section_header("Managementul Riscului Operațional și Alarme", "CAPITOLUL 6")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Aceste instrumente sunt concepute pentru a proteja securitatea fizică și financiară a operațiunilor, "
            "detectând timpuriu comportamente neobișnuite, riscuri logistice și posibile abateri "
            "de la normele interne. Ele rulează heuristici avansate de audit."
        )
        self.multi_cell(0, 5, intro)
        self.ln(5)
        
        # Tools
        self.draw_tool_card(
            "mcp_operational_risk_sweep",
            "tools:analytics:read",
            "Efectuează o scanare completă a riscurilor operaționale curente ale companiei. Verifică nivelurile stocurilor critice, "
            "comenzile blocate administrativ, facturile cu risc de neplată și anomalii de procesare. Returnează o listă de alertă "
            "cu identificatori unici de problemă (problem_id).",
            "mcp_operational_risk_sweep() - Centralizator de riscuri operaționale."
        )
        
        self.draw_tool_card(
            "mcp_operational_risk_detail",
            "tools:analytics:read",
            "Extrage detaliile tehnice și analitice complete pentru un risc specific semnalat în faza de sweep. Oferă contextul "
            "exact, persoanele implicate, impactul financiar estimat și recomandările de remediere pe baza ID-ului problemei.",
            "mcp_operational_risk_detail(problem_id='RISK-2026-004') - Fișa detaliată alertei."
        )
        
        self.draw_tool_card(
            "analyze_fraud_signals",
            "tools:analytics:read",
            "Analizează semnalele de fraudă sau anomalii de tranzacționare în baza ERP. Caută reduceri suspect de mari aplicate manual, "
            "modificări retroactive ale facturilor, modificări neuzuale ale prețurilor din catalog sau comenzi procesate în afara "
            "orelor de program fără aprobare.",
            "analyze_fraud_signals(limit=10) - Auditul tranzacțiilor suspicioase."
        )
        
        self.draw_tool_card(
            "analyze_stock_risk_signals",
            "tools:analytics:read",
            "Identifică riscurile legate de stocuri. Depistează produsele cu cerere mare dar cu stoc de siguranță epuizat "
            "sau produse ale căror timpi de reaprovizionare de la furnizori depășesc termenele de livrare promise clienților.",
            "analyze_stock_risk_signals() - Prevenirea epuizării stocurilor la produsele populare."
        )

    def write_reports_page(self):
        self.add_page()
        self.draw_section_header("Business Intelligence, Contabilitate și Rapoarte", "CAPITOLUL 7")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Rapoartele sintetice reprezintă nucleul decizional din iFlow ERP. MCP expune agregate complexe, "
            "similare cu cele afișate în interfața grafică web, dar accesibile prin interogări naturale "
            "și corelări AI."
        )
        self.multi_cell(0, 5, intro)
        self.ln(5)
        
        # Tools
        self.draw_tool_card(
            "report_sales  /  report_profit  /  report_total_sales",
            "tools:erp:read",
            "Generează evoluțiile vânzărilor brute, ale adaosului comercial și ale profitului net. Acceptă grupări temporale "
            "(zilnice, săptămânale, lunare), filtre pe categorii de produse, agenți de vânzări sau zone geografice.",
            "report_profit(group_by='month', from_date='2026-01-01') - Profitul pe luni în 2026."
        )
        
        self.draw_tool_card(
            "report_quantity  /  report_employee  /  report_equipments_gantt",
            "tools:erp:read",
            "Rapoarte specifice pentru producție și logistică. report_quantity arată volumul fizic vândut, report_employee "
            "evaluează eficiența muncii pe angajat, iar report_equipments_gantt oferă planificarea grafică Gantt a utilajelor din fabrică.",
            "report_equipments_gantt() - Rata de încărcare a echipamentelor de producție."
        )
        
        self.draw_tool_card(
            "accounting_partner_balance  /  accounting_invoices_issued",
            "tools:erp:read",
            "Contabilitate primară. accounting_partner_balance generează balanța de verificare pentru clienți și furnizori (solduri, "
            "rulaje, debite restante), iar accounting_invoices_issued listează toate facturile emise cu stadiul lor fiscal.",
            "accounting_partner_balance(partner_type='customer') - Balanța de solduri clienți."
        )
        
        self.draw_tool_card(
            "accounting_stock_balance  /  accounting_intrastat",
            "tools:erp:read",
            "Balanța de stocuri la zi (valorică și cantitativă per depozit) și generarea declarației Intrastat pentru schimburile "
            "de bunuri din cadrul Uniunii Europene.",
            "accounting_stock_balance(warehouse_id=2) - Valoarea curentă a depozitului central."
        )

    def write_writes_and_security_page(self):
        self.add_page()
        self.draw_section_header("Scrieri Securizate și Managementul Drepturilor", "CAPITOLUL 8")
        
        self.set_font("Arial", "", 10)
        self.set_text_color(*self.c_neutral_dark)
        intro = (
            "Sistemul MCP nu este doar un instrument de citire, ci permite și automatizarea operațiunilor prin scrieri. "
            "Pentru a garanta siguranța absolută, acțiunile de scriere sunt supuse unor mecanisme avansate de confirmare, "
            "audit și limitare a drepturilor de acces."
        )
        self.multi_cell(0, 5, intro)
        self.ln(5)
        
        # Tools
        self.draw_tool_card(
            "create_order  /  create_client  /  create_product",
            "tools:orders:write / tools:erp:write",
            "Permit crearea directă în baza ERP a unei comenzi noi cu linii de produse, a unui fișe de client nou sau "
            "adunarea unui produs în nomenclator. De asemenea, update_product permite actualizarea prețurilor sau descrierilor.",
            "create_order(client_id=14, items=[{'product_id': 102, 'quantity': 50}])"
        )
        
        self.draw_tool_card(
            "update_order_status  /  mark_order_finished  /  mark_order_billed",
            "tools:orders:write",
            "Modifică starea comenzilor în baza de date. Trecerea unei comenzi în stadiul 'Finalizată' sau 'Facturată' declanșează "
            "în mod automat evenimentele ERP corespunzătoare (scăderea din stoc, generarea fișelor de expediție).",
            "mark_order_finished(order_id=459, confirm=True)"
        )
        
        # Sub-secțiune: Securitate
        self.set_font("Georgia", "B", 13)
        self.set_text_color(*self.c_primary)
        self.cell(0, 8, "Mecanisme de Securitate și Integritate:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_fill_color(*self.c_accent)
        self.rect(self.get_x(), self.get_y(), 20, 1.5, "F")
        self.ln(4)
        
        sec_points = [
            ("Modul Read-Only", "Prin setarea IFLOW_READ_ONLY=1, toate operațiunile de scriere sunt blocate complet la nivel de server, asigurând siguranța absolută a datelor ERP în medii exploratorii."),
            ("Scopes OAuth", "Fiecare instrument este mapat pe permisiuni specifice (ex: tools:analytics:read sau tools:orders:write). Modelele de AI nu pot apela funcții neautorizate prin token."),
            ("Confirmare în Doi Pași (Two-Phase)", "Dacă API-ul extern returnează codul confirmation_required, serverul MCP cere o confirmare manuală ce trimite headerul special X-MCP-Confirm-Token."),
            ("Audit & Idempotentă", "Fiecare scriere generează o înregistrare de audit în ReportsRecentActivity și utilizează Idempotency-Key pentru a preveni duplicarea tranzacțiilor din cauza erorilor de rețea.")
        ]
        
        self.set_font("Arial", "", 9.5)
        for title, detail in sec_points:
            self.set_font("Arial", "B", 9.5)
            self.set_text_color(*self.c_secondary)
            self.cell(0, 5, f"   - {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_font("Arial", "", 9.5)
            self.set_text_color(*self.c_neutral_dark)
            self.multi_cell(0, 4.5, f"     {detail}")
            self.ln(2)

def main():
    pdf = IFlowMCPDoc()
    
    # 1. Pagina de titlu
    pdf.create_cover_page()
    
    # 2. Introducere și arhitectură
    pdf.write_introduction_page()
    
    # 3. Fluxul Asistentului Virtual (Meta-Tools)
    pdf.write_virtual_assistant_page()
    
    # 4. Căutări și Listări Parametrizate (Phase 1.2 & Lookups)
    pdf.write_listings_page()
    
    # 5. Operațiuni Curente și Fluxuri de Lucru
    pdf.write_operations_page()
    
    # 6. Analize Financiare și Diagnostic de Business
    pdf.write_analyst_page()
    
    # 7. Managementul Riscului Operațional și Alarme
    pdf.write_operational_risk_page()
    
    # 8. Business Intelligence și Contabilitate
    pdf.write_reports_page()
    
    # 9. Scrieri Securizate și Managementul Drepturilor
    pdf.write_writes_and_security_page()
    
    # Salvare PDF
    pdf_path = "/Users/ciprian/Documents/projects/ionut/iflow-mcp/iflow_mcp_tools_presentation.pdf"
    pdf.output(pdf_path)
    print(f"PDF generated successfully at: {pdf_path}")

if __name__ == "__main__":
    main()
