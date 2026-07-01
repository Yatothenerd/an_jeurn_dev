"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/app/admin/_components/Icon";
import type { EntranceStyle } from "@/lib/services/site-settings.service";
import s from "./landing.module.css";

type Lang = "km" | "en";

/* ── bilingual copy ──────────────────────────────────────────── */
const t = {
  nav: {
    services: { km: "សេវាកម្ម", en: "Services" },
    themes: { km: "ទម្រង់", en: "Themes" },
    how: { km: "របៀបប្រើ", en: "How it works" },
    pricing: { km: "តម្លៃ", en: "Pricing" },
    contact: { km: "ទំនាក់ទំនង", en: "Contact" },
    login: { km: "ចូល", en: "Log in" },
    start: { km: "ចាប់ផ្តើម", en: "Get started" },
  },
  services: {
    eyebrow: { km: "អ្វីដែលយើងធ្វើ", en: "What we craft" },
    title: { km: "Everything for a flawless invitation", en: "Everything for a flawless invitation" },
    sub: {
      km: "ពីការរចនា រហូតដល់ការគ្រប់គ្រងភ្ញៀវ — យើងបង្កើតគ្រប់ផ្នែក។",
      en: "From design to guest management, every detail is handled with care.",
    },
    items: [
      { icon: "invitation", title: { km: "ការអញ្ជើញឌីជីថល", en: "Digital invitations" }, text: { km: "ការអញ្ជើញដ៏ស្រស់ស្អាត ដែលបើកមើលបានគ្រប់ឧបករណ៍។", en: "Beautiful, mobile-first invitations that open on any device." } },
      { icon: "theme", title: { km: "ទម្រង់ប្រណិត", en: "Bespoke themes" }, text: { km: "ទម្រង់ខ្មែរបុរាណ និងសម័យទំនើប ប្ដូរតាមបំណង។", en: "Royal Khmer and modern designs, tailored to your event." } },
      { icon: "guest", title: { km: "គ្រប់គ្រងភ្ញៀវ", en: "Guest management" }, text: { km: "បញ្ជីភ្ញៀវ ការអញ្ជើញផ្ទាល់ខ្លួន និងតាមដាន RSVP។", en: "Guest lists, personalised invites, and RSVP tracking." } },
      { icon: "dress-code", title: { km: "ការណែនាំ & កូដសម្លៀកបំពាក់", en: "Details & dress code" }, text: { km: "ម៉ោង ផែនទី កម្មវិធី និងកូដសម្លៀកបំពាក់ ច្បាស់លាស់។", en: "Schedule, maps, agenda, and a clear dress code for guests." } },
      { icon: "day", title: { km: "ចែករំលែកភ្លាមៗ", en: "Instant sharing" }, text: { km: "តំណមួយ ចែករំលែកតាម Telegram, Facebook ឬ QR។", en: "One link to share via Telegram, Facebook, or QR code." } },
      { icon: "package", title: { km: "កញ្ចប់សមរម្យ", en: "Flexible packages" }, text: { km: "កញ្ចប់សមស្របនឹងថវិកា និងទំហំកម្មវិធីរបស់អ្នក។", en: "Packages that fit your budget and the scale of your event." } },
    ],
  },
  how: {
    eyebrow: { km: "ងាយស្រួល", en: "Simple process" },
    title: { km: "How it works", en: "How it works" },
    sub: { km: "បីជំហានដ៏សាមញ្ញ ទៅកាន់ការអញ្ជើញដ៏ល្អឥតខ្ចោះ។", en: "Three easy steps to a stunning invitation." },
    steps: [
      { title: { km: "ជ្រើសរើសទម្រង់", en: "Choose a theme" }, text: { km: "ជ្រើសរើសរចនាប័ទ្មដែលសាកសមនឹងកម្មវិធីរបស់អ្នក។", en: "Pick a design that matches the spirit of your celebration." } },
      { title: { km: "បន្ថែមព័ត៌មាន", en: "Add your details" }, text: { km: "ក្រុមការងាររបស់យើងរៀបចំរូបភាព អត្ថបទ និងភ្ញៀវ។", en: "Our team sets up your photos, wording, and guest list." } },
      { title: { km: "ចែករំលែក", en: "Share & celebrate" }, text: { km: "ទទួលតំណផ្ទាល់ខ្លួន រួចចែករំលែកទៅភ្ញៀវរបស់អ្នក។", en: "Get a personal link and share it with every guest." } },
    ],
  },
  themes: {
    eyebrow: { km: "បណ្ណាល័យទម្រង់", en: "Theme gallery" },
    title: { km: "Designs to fall in love with", en: "Designs to fall in love with" },
    sub: { km: "ទម្រង់នីមួយៗ ត្រូវបានរចនាដោយយកចិត្តទុកដាក់រាល់ព័ត៌មានលម្អិត។", en: "Each theme is crafted down to the smallest ornament." },
    items: [
      { cls: "themeRoyal", name: "Royal Khmer", kh: "ខ្មែរបុរាណ", tag: { km: "មាស & ទឹកក្រូចឆ្មារ", en: "Gold & maroon" } },
      { cls: "themeLight", name: "Azure Light", kh: "ពន្លឺខៀវ", tag: { km: "ស្រាល & ទំនើប", en: "Light & modern" } },
      { cls: "themeRose", name: "Rose Garden", kh: "សួនកុលាប", tag: { km: "ផ្កា & មនោសញ្ចេតនា", en: "Floral & romantic" } },
    ],
  },
  pricing: {
    eyebrow: { km: "តម្លៃ", en: "Pricing" },
    title: { km: "Simple, honest packages", en: "Simple, honest packages" },
    sub: { km: "បង់ម្តង សម្រាប់កម្មវិធីមួយ — គ្មានការគិតថ្លៃលាក់កំបាំង។", en: "One-time price per event — no hidden fees." },
    perEvent: { km: "/ កម្មវិធី", en: "/ event" },
    popular: { km: "ពេញនិយម", en: "Most popular" },
    choose: { km: "ជ្រើសរើស", en: "Choose plan" },
    tiers: [
      { name: "Essential", kh: "មូលដ្ឋាន", price: "$29", featured: false, feats: { km: ["ការអញ្ជើញឌីជីថល ១", "ទម្រង់ស្តង់ដារ", "ភ្ញៀវរហូតដល់ ១០០", "តំណចែករំលែក & QR"], en: ["1 digital invitation", "Standard theme", "Up to 100 guests", "Share link & QR code"] } },
      { name: "Signature", kh: "ពិសេស", price: "$59", featured: true, feats: { km: ["ទម្រង់ប្រណិតទាំងអស់", "ភ្ញៀវរហូតដល់ ៥០០", "ការអញ្ជើញផ្ទាល់ខ្លួន", "តាមដាន RSVP", "កម្មវិធី & ផែនទីលម្អិត"], en: ["All premium themes", "Up to 500 guests", "Personalised guest invites", "RSVP tracking", "Full agenda & maps"] } },
      { name: "Royal", kh: "ស្តេច", price: "$99", featured: false, feats: { km: ["ភ្ញៀវមិនកំណត់", "ការរចនាប្ដូរតាមបំណង", "វិចិត្រសាល & វីដេអូ", "តន្ត្រី & ចលនា", "ការគាំទ្រអាទិភាព"], en: ["Unlimited guests", "Custom bespoke design", "Photo gallery & video", "Music & animations", "Priority support"] } },
    ],
  },
  quote: {
    text: { km: "“រាល់ការប្រារព្ធពិធី សមនឹងទទួលបានការអញ្ជើញដ៏ស្រស់ស្អាត។”", en: "“Every celebration deserves an invitation as beautiful as the moment itself.”" },
    author: { km: "ក្រុមការងារ anjeurn", en: "The anjeurn team" },
  },
  cta: {
    title: { km: "Ready to create your invitation?", en: "Ready to create your invitation?" },
    sub: { km: "ចាប់ផ្តើមថ្ងៃនេះ ហើយធ្វើឱ្យកម្មវិធីរបស់អ្នកគួរឱ្យចងចាំ។", en: "Start today and make your celebration unforgettable." },
    start: { km: "ចាប់ផ្តើមឥឡូវនេះ", en: "Get started now" },
    contact: { km: "និយាយជាមួយយើង", en: "Talk to us" },
  },
  footer: {
    blurb: { km: "anjeurn បង្កើតការអញ្ជើញឌីជីថលដ៏ឆើតឆាយ សម្រាប់អាពាហ៍ពិពាហ៍ និងពិធីបុណ្យខ្មែរ។", en: "anjeurn crafts elegant digital invitations for Khmer weddings and celebrations." },
    explore: { km: "ស្វែងរក", en: "Explore" },
    company: { km: "ក្រុមហ៊ុន", en: "Company" },
    contact: { km: "ទំនាក់ទំនង", en: "Contact" },
    rights: { km: "រក្សាសិទ្ធិគ្រប់យ៉ាង។", en: "All rights reserved." },
  },
};

export function LandingPage({ entranceStyle = "fade" }: { entranceStyle?: EntranceStyle }) {
  const [lang, setLang] = useState<Lang>("km");
  const L = (pair: { km: string; en: string }) => pair[lang];
  const isKm = lang === "km";

  // Entrance reveal class (initial page load). Admin-configurable via /admin/settings.
  const entranceClass =
    entranceStyle === "none" ? "" :
    entranceStyle === "slideUp" ? s.entranceSlideUp :
    entranceStyle === "zoom" ? s.entranceZoom :
    s.entranceFade;

  return (
    <div className={`${s.page} ${entranceClass}`}>
      {/* ── NAV ───────────────────────────────────────────── */}
      <nav className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <Link href="/" className={s.brand}>
            <img src="/logo/kh-eng.svg" alt="Anjeurn" style={{ height: 44, display: "block" }} />
          </Link>

          <div className={s.navLinks}>
            <a href="#services" className={s.navLink}>{L(t.nav.services)}</a>
            <a href="#themes" className={s.navLink}>{L(t.nav.themes)}</a>
            <a href="#how" className={s.navLink}>{L(t.nav.how)}</a>
            <a href="#pricing" className={s.navLink}>{L(t.nav.pricing)}</a>
            <a href="#contact" className={s.navLink}>{L(t.nav.contact)}</a>
          </div>

          <div className={s.navRight}>
            <div className={s.langToggle}>
              <button className={`${s.langBtn} ${isKm ? s.langBtnActive : ""}`} onClick={() => setLang("km")}>ខ្មែរ</button>
              <button className={`${s.langBtn} ${!isKm ? s.langBtnActive : ""}`} onClick={() => setLang("en")}>EN</button>
            </div>
            <Link href="/login" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}>{L(t.nav.login)}</Link>
            <Link href="/login" className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`}>{L(t.nav.start)}</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <header className={s.hero}>
        <div className={`${s.wrap} ${s.heroInner}`}>
          <img src="/logo/full.svg" alt="Anjeurn" className={s.heroLogo} />
          <span className={s.eyebrow}>{isKm ? "ការអញ្ជើញឌីជីថលខ្មែរ" : "Khmer digital invitations"}</span>
          {isKm
            ? <h1 className={s.heroKh} lang="km">សិល្បៈនៃការអញ្ជើញ</h1>
            : <h1 className={s.heroEn}>The art of the <em>invitation</em>, made&nbsp;digital.</h1>}
          <p className={s.heroLead}>
            {isKm
              ? "យើងបង្កើតការអញ្ជើញឌីជីថលដ៏ស្រស់ស្អាត សម្រាប់អាពាហ៍ពិពាហ៍ និងពិធីបុណ្យរបស់អ្នក — ងាយស្រួលចែករំលែក និងគួរឱ្យចងចាំ។"
              : "We design elegant digital invitations for your wedding and special events — effortless to share and impossible to forget."}
          </p>
          <div className={s.heroCtas}>
            <Link href="/login" className={`${s.btn} ${s.btnPrimary}`}>{L(t.cta.start)} →</Link>
            <a href="#themes" className={`${s.btn} ${s.btnGhost}`}>{L(t.nav.themes)}</a>
          </div>
          <p className={s.heroTrust}>{isKm ? "ទុកចិត្តដោយ" : "Trusted by"} <b>500+</b> {isKm ? "គូស្នេហ៍ និងគ្រួសារ" : "couples & families"}</p>
        </div>
      </header>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div className={s.wrap}>
        <div className={s.stats}>
          {[
            { n: "500+", l: { km: "កម្មវិធី", en: "Events" } },
            { n: "50k+", l: { km: "ភ្ញៀវបានអញ្ជើញ", en: "Guests invited" } },
            { n: "12", l: { km: "ទម្រង់ប្រណិត", en: "Premium themes" } },
            { n: "4.9★", l: { km: "ការវាយតម្លៃ", en: "Avg. rating" } },
          ].map((x) => (
            <div key={x.n} className={s.stat}>
              <div className={s.statNum}>{x.n}</div>
              <div className={s.statLabel}>{L(x.l)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <div className={s.ornament}><span>✦</span></div>
            <span className={s.eyebrow}>{L(t.services.eyebrow)}</span>
            <h2 className={s.sectionTitle}>{L(t.services.title)}</h2>
            <p className={s.sectionSub}>{L(t.services.sub)}</p>
          </div>
          <div className={s.grid3}>
            {t.services.items.map((it) => (
              <div key={it.icon} className={s.card}>
                <div className={s.cardIcon}><Icon name={it.icon} size={26} /></div>
                <h3 className={s.cardTitle}>{L(it.title)}</h3>
                <p className={s.cardText}>{L(it.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how" className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <div className={s.ornament}><span>✦</span></div>
            <span className={s.eyebrow}>{L(t.how.eyebrow)}</span>
            <h2 className={s.sectionTitle}>{L(t.how.title)}</h2>
            <p className={s.sectionSub}>{L(t.how.sub)}</p>
          </div>
          <div className={s.steps}>
            {t.how.steps.map((st, i) => (
              <div key={i} className={s.step}>
                <div className={s.stepNum}>{i + 1}</div>
                <h3 className={s.stepTitle}>{L(st.title)}</h3>
                <p className={s.stepText}>{L(st.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THEMES ────────────────────────────────────────── */}
      <section id="themes" className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <div className={s.ornament}><span>✦</span></div>
            <span className={s.eyebrow}>{L(t.themes.eyebrow)}</span>
            <h2 className={s.sectionTitle}>{L(t.themes.title)}</h2>
            <p className={s.sectionSub}>{L(t.themes.sub)}</p>
          </div>
          <div className={s.themeGrid}>
            {t.themes.items.map((th) => (
              <Link href="/login" key={th.name} className={`${s.themeCard} ${s[th.cls]}`}>
                <span className={s.themeFrame} />
                <h3 className={s.themeName}>{th.name}</h3>
                {isKm && <p className={s.themeKh} lang="km">{th.kh}</p>}
                <span className={s.themeTag}>{L(th.tag)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <div className={s.ornament}><span>✦</span></div>
            <span className={s.eyebrow}>{L(t.pricing.eyebrow)}</span>
            <h2 className={s.sectionTitle}>{L(t.pricing.title)}</h2>
            <p className={s.sectionSub}>{L(t.pricing.sub)}</p>
          </div>
          <div className={s.priceGrid}>
            {t.pricing.tiers.map((tier) => (
              <div key={tier.name} className={`${s.priceCard} ${tier.featured ? s.priceCardFeatured : ""}`}>
                {tier.featured && <span className={s.priceBadge}>{L(t.pricing.popular)}</span>}
                <h3 className={s.priceName}>{tier.name}</h3>
                {isKm && <p className={s.priceKh} lang="km">{tier.kh}</p>}
                <div className={s.priceAmt}>{tier.price} <small>{L(t.pricing.perEvent)}</small></div>
                <ul className={s.priceList}>
                  {tier.feats[lang].map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link href="/login" className={`${s.btn} ${tier.featured ? s.btnPrimary : s.btnGhost}`}>{L(t.pricing.choose)}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ─────────────────────────────────────────── */}
      <section className={s.quoteBand}>
        <div className={s.wrap}>
          <div className={s.quoteMark}>“</div>
          <p className={s.quoteText}>{L(t.quote.text).replace(/^“|”$/g, "")}</p>
          <p className={s.quoteAuthor}>{L(t.quote.author)}</p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section id="contact" className={s.cta}>
        <div className={s.wrap}>
          <div className={s.ctaInner}>
            <div className={s.ornament}><span>❧</span></div>
            <h2 className={s.sectionTitle}>{L(t.cta.title)}</h2>
            <p className={s.sectionSub} style={{ marginBottom: "2rem" }}>{L(t.cta.sub)}</p>
            <div className={s.heroCtas}>
              <Link href="/login" className={`${s.btn} ${s.btnPrimary}`}>{L(t.cta.start)} →</Link>
              <a href="mailto:hello@anjeurn.com" className={`${s.btn} ${s.btnGhost}`}>{L(t.cta.contact)}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.footTop}>
            <div className={s.footBrand}>
              <img src="/logo/kh-eng.svg" alt="Anjeurn" style={{ height: 40, display: "block" }} />
              <p className={s.footBlurb}>{L(t.footer.blurb)}</p>
            </div>
            <div>
              <p className={s.footColTitle}>{L(t.footer.explore)}</p>
              <ul className={s.footList}>
                <li><a href="#services">{L(t.nav.services)}</a></li>
                <li><a href="#themes">{L(t.nav.themes)}</a></li>
                <li><a href="#pricing">{L(t.nav.pricing)}</a></li>
              </ul>
            </div>
            <div>
              <p className={s.footColTitle}>{L(t.footer.company)}</p>
              <ul className={s.footList}>
                <li><a href="#how">{L(t.nav.how)}</a></li>
                <li><Link href="/login">{L(t.nav.login)}</Link></li>
              </ul>
            </div>
            <div>
              <p className={s.footColTitle}>{L(t.footer.contact)}</p>
              <ul className={s.footList}>
                <li><a href="mailto:hello@anjeurn.com">hello@anjeurn.com</a></li>
                <li><span>Phnom Penh, Cambodia</span></li>
              </ul>
            </div>
          </div>
          <div className={s.footBottom}>
            <span>© {new Date().getFullYear()} anjeurn · អញ្ជើញ</span>
            <span>{L(t.footer.rights)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
