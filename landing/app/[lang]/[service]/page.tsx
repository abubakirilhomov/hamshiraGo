import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hamshirago.uz";

/* ── Service data ───────────────────────────────────────────────── */
type ServiceInfo = {
  slug: string;
  lang: "ru" | "uz";
  title: string;
  h1: string;
  description: string;
  keywords: string;
  price: string;
  intro: string;
  benefits: { icon: string; title: string; desc: string }[];
  faq: { q: string; a: string }[];
  breadcrumbLabel: string;
  ctaText: string;
  altLang: string;
  altSlug: string;
};

const SERVICES: ServiceInfo[] = [
  {
    slug: "ukol-na-domu",
    lang: "ru",
    altLang: "uz",
    altSlug: "ukol-uyda",
    breadcrumbLabel: "Укол на дому",
    h1: "Укол на дому в Ташкенте",
    title: "Укол на дому в Ташкенте — медсестра за 30 минут | HamshiraGo",
    description:
      "Вызовите медсестру на дом для укола в Ташкенте. Внутримышечные и подкожные инъекции, антибиотики, витамины. Цена от 80 000 сум. Приедем за 30 минут, 24/7.",
    keywords:
      "укол на дому Ташкент, медсестра укол на дом, укол антибиотик дома, внутримышечный укол на дому, вызов медсестры укол, подкожная инъекция на дому, укол на дом цена Ташкент, uyda ukol Toshkent",
    price: "от 80 000 сум",
    intro:
      "HamshiraGo — сервис вызова медсестры на дом в Ташкенте. Нужен укол? Не нужно ехать в поликлинику — наша верифицированная медсестра приедет домой и сделает внутримышечный или подкожный укол по назначению врача. Работаем 24 часа в сутки, 7 дней в неделю, включая ночное время и праздники.",
    benefits: [
      { icon: "⚡", title: "Приедем за 30 минут", desc: "Медсестра выедет сразу после оформления заказа через приложение или сайт." },
      { icon: "🔒", title: "Только одноразовые расходники", desc: "Стерильные иглы, шприцы и перчатки — всё одноразовое. Полная безопасность." },
      { icon: "🩺", title: "Верифицированные медсёстры", desc: "Каждый медик проходит проверку диплома, паспорта и лицензии на практику." },
      { icon: "🌙", title: "24/7 без выходных", desc: "Принимаем заказы ночью, в выходные и государственные праздники Узбекистана." },
      { icon: "💳", title: "Оплата Payme / Click", desc: "Онлайн-оплата прямо в приложении. Наличные не нужны." },
      { icon: "📍", title: "Весь Ташкент", desc: "Работаем во всех районах: Юнусабад, Чиланзар, Мирзо-Улугбек, Яккасарай и др." },
    ],
    faq: [
      { q: "Сколько стоит укол на дому в Ташкенте?", a: "Стоимость укола на дому начинается от 80 000 сум. Итоговая цена зависит от сложности процедуры и времени суток. Точную цену вы увидите при оформлении заказа в приложении HamshiraGo." },
      { q: "Какие уколы делает медсестра на дому?", a: "Медсестра сделает любой укол по назначению врача: антибиотики (цефтриаксон, пенициллин), витамины (B12, B6), противовоспалительные (диклофенак, кеторол), обезболивающие, инсулин и другие. Внутримышечно и подкожно." },
      { q: "Нужно ли готовить что-то перед приездом медсестры?", a: "Да — заранее уточните у врача название препарата, дозировку и способ введения. Подготовьте ампулу или флакон. Медсестра привезёт шприц, иглу, спирт и перчатки." },
      { q: "Как быстро приедет медсестра для укола?", a: "В среднем медсестра приезжает за 25–35 минут после подтверждения заказа. В приложении вы видите её маршрут на карте в реальном времени." },
      { q: "Работаете ли ночью и в выходные?", a: "Да, HamshiraGo работает 24/7, в том числе ночью, в субботу, воскресенье и государственные праздники Узбекистана." },
    ],
    ctaText: "Вызвать медсестру для укола",
  },
  {
    slug: "kapelnica-na-domu",
    lang: "ru",
    altLang: "uz",
    altSlug: "tomchi-uyda",
    breadcrumbLabel: "Капельница на дому",
    h1: "Капельница на дому в Ташкенте",
    title: "Капельница на дому в Ташкенте — медсестра за 30 минут | HamshiraGo",
    description:
      "Поставьте капельницу дома в Ташкенте без выезда в больницу. Глюкоза, физраствор, витамины по назначению врача. Цена от 150 000 сум. Медсестра приедет за 30 минут, 24/7.",
    keywords:
      "капельница на дому Ташкент, вызов медсестры капельница, поставить капельницу дома, капельница глюкоза на дому, капельница физраствор дома, капельница витамины на дому, внутривенная капельница на дому, tomchi uyda Toshkent",
    price: "от 150 000 сум",
    intro:
      "Нужна капельница, но ехать в больницу нет сил? HamshiraGo пришлёт опытную медсестру к вам домой в Ташкенте. Медсестра привезёт всё необходимое оборудование — систему для капельницы, физраствор или глюкозу — и проведёт процедуру в домашних условиях. Работаем круглосуточно.",
    benefits: [
      { icon: "⚡", title: "Медсестра за 30 минут", desc: "После заказа медсестра выезжает немедленно. Среднее время прибытия — 25–35 минут." },
      { icon: "🩺", title: "Привезём оборудование", desc: "Медсестра приедет со стерильной системой для капельниц. Вам нужен только препарат по назначению врача." },
      { icon: "🔒", title: "Полная стерильность", desc: "Одноразовые системы, перчатки и дезинфекция — строгое соблюдение медицинских стандартов." },
      { icon: "🌙", title: "24/7", desc: "Заказ принимаем ночью, в выходные и праздничные дни." },
      { icon: "💳", title: "Payme / Click", desc: "Удобная онлайн-оплата без наличных." },
      { icon: "📍", title: "Весь Ташкент", desc: "Юнусабад, Чиланзар, Яккасарай, Мирзо-Улугбек, Сергели, Алмазар и другие районы." },
    ],
    faq: [
      { q: "Сколько стоит капельница на дому в Ташкенте?", a: "Стоимость капельницы на дому начинается от 150 000 сум. В стоимость входит работа медсестры и одноразовая система. Сам препарат (если не входит в стандартный набор) нужно подготовить заранее — уточните при заказе." },
      { q: "Что нужно подготовить для капельницы дома?", a: "Уточните у врача состав капельницы, объём и скорость введения. Подготовьте прописанный препарат. Медсестра привезёт систему, физраствор (если нужен), иглу, пластырь, перчатки и дезинфектант." },
      { q: "Какие капельницы ставит медсестра на дому?", a: "Медсестра поставит капельницу с глюкозой, физраствором, витаминами группы B, магнезией, хлоридом натрия или другими препаратами по назначению врача. Для сложных схем уточняйте состав при оформлении заказа." },
      { q: "Как долго длится капельница дома?", a: "Продолжительность зависит от объёма и скорости введения — обычно от 30 минут до 1,5 часов. Медсестра следит за пациентом на протяжении всей процедуры." },
      { q: "Можно ли поставить капельницу ночью?", a: "Да, HamshiraGo работает 24/7. Принимаем заказы в любое время суток, включая ночные часы." },
    ],
    ctaText: "Вызвать медсестру для капельницы",
  },
  {
    slug: "izmerenie-davleniya",
    lang: "ru",
    altLang: "uz",
    altSlug: "qon-bosimi-ekz",
    breadcrumbLabel: "Давление и ЭКГ",
    h1: "Измерение давления и ЭКГ на дому в Ташкенте",
    title: "Измерение давления и ЭКГ на дому в Ташкенте | HamshiraGo",
    description:
      "Вызовите медсестру на дом для измерения давления и снятия ЭКГ в Ташкенте. Быстрый результат без очередей. Цена от 50 000 сум. Работаем 24/7.",
    keywords:
      "измерение давления на дому Ташкент, ЭКГ на дому Ташкент, снять ЭКГ дома, контроль давления на дому, артериальное давление медсестра, электрокардиограмма на дому, qon bosimi uyda, EKG uyda Toshkent",
    price: "от 50 000 сум",
    intro:
      "Страдаете гипертонией или беспокоят боли в сердце? Медсестра HamshiraGo приедет домой, измерит артериальное давление и пульс, при необходимости снимет ЭКГ. Получите результаты на руки без поездки в поликлинику и часовых очередей.",
    benefits: [
      { icon: "❤️", title: "Контроль давления дома", desc: "Профессиональный тонометр, трёхкратное измерение с интервалом — точный результат." },
      { icon: "📊", title: "ЭКГ за 10 минут", desc: "Медсестра снимет 12-канальную ЭКГ, распечатает и объяснит базовые показатели." },
      { icon: "🔒", title: "Верифицированные медики", desc: "Каждый медик прошёл проверку диплома и лицензии." },
      { icon: "🌙", title: "24/7", desc: "Острое ухудшение самочувствия? Принимаем заказы в любое время." },
      { icon: "💳", title: "Payme / Click", desc: "Оплата онлайн — удобно и безопасно." },
      { icon: "📍", title: "Весь Ташкент", desc: "Все районы города: Юнусабад, Мирзо-Улугбек, Чиланзар, Яккасарай и другие." },
    ],
    faq: [
      { q: "Сколько стоит измерение давления на дому?", a: "Измерение артериального давления и пульса на дому начинается от 50 000 сум. Снятие ЭКГ включено в ту же процедуру или оформляется отдельно — уточните при заказе в HamshiraGo." },
      { q: "Зачем измерять давление дома, а не в поликлинике?", a: "Домашнее измерение точнее отражает реальное давление пациента: нет «эффекта белого халата», нет стресса от поездки. Особенно важно для пожилых людей и пациентов после инсульта или инфаркта." },
      { q: "Нужно ли мне готовиться к измерению давления?", a: "За 30 минут до измерения не курите, не пейте кофе, не занимайтесь физической нагрузкой. Посидите спокойно 5 минут. Медсестра проведёт несколько измерений для точности." },
      { q: "Насколько точен ЭКГ на дому?", a: "Медсестра использует портативный профессиональный электрокардиограф с 12 отведениями — точность такая же, как в клинике. Расшифровку даёт кардиолог (по запросу)." },
    ],
    ctaText: "Вызвать медсестру для ЭКГ",
  },
  {
    slug: "uxod-na-domu",
    lang: "ru",
    altLang: "uz",
    altSlug: "uyda-parvarish",
    breadcrumbLabel: "Уход на дому",
    h1: "Уход за больным на дому в Ташкенте",
    title: "Уход за больным на дому в Ташкенте — медсестра | HamshiraGo",
    description:
      "Профессиональный уход за пожилыми и лежачими больными на дому в Ташкенте. Перевязки, реабилитация после операции, профилактика пролежней. Цена от 200 000 сум.",
    keywords:
      "уход за больным на дому Ташкент, медсестра по уходу на дому, уход за пожилым на дому, лежачий больной уход, реабилитация после операции дома, перевязка на дому, uyda parvarish Toshkent, keksalar uchun uyda yordam",
    price: "от 200 000 сум",
    intro:
      "После выписки из больницы или при хроническом заболевании профессиональный уход на дому критически важен. HamshiraGo обеспечит квалифицированную медсестру для ухода за пожилыми и лежачими пациентами в Ташкенте: перевязки, профилактика пролежней, контроль состояния, инъекции по расписанию.",
    benefits: [
      { icon: "🏥", title: "Постоянный или разовый уход", desc: "Договоритесь о ежедневных визитах или разовых процедурах — гибкий график под ваши нужды." },
      { icon: "🩹", title: "Перевязки и обработка ран", desc: "Стерильная обработка послеоперационных швов, трофических язв и пролежней." },
      { icon: "💊", title: "Инъекции по расписанию", desc: "Курс уколов или капельниц по назначению врача — медсестра приедет в нужное время." },
      { icon: "👴", title: "Уход за пожилыми", desc: "Гигиена, контроль давления, помощь при движении — бережно и профессионально." },
      { icon: "🔒", title: "Верифицированные медики", desc: "Каждая медсестра прошла проверку документов и лицензии." },
      { icon: "📍", title: "Весь Ташкент", desc: "Все районы города, включая пригороды — уточняйте при заказе." },
    ],
    faq: [
      { q: "Сколько стоит уход на дому в Ташкенте?", a: "Стоимость ухода на дому начинается от 200 000 сум за визит. Итоговая цена зависит от объёма процедур и продолжительности визита. Долгосрочный уход обсуждается индивидуально." },
      { q: "Как организовать ежедневный уход за пожилым родственником?", a: "Оформите заказ в приложении HamshiraGo, укажите нужное расписание и перечень процедур. Мы назначим медсестру, которая будет приезжать в удобное время." },
      { q: "Что входит в услугу ухода на дому?", a: "Уход включает: утреннюю гигиену, профилактику и обработку пролежней, перевязку ран, инъекции по расписанию, измерение давления и температуры, кормление лежачих пациентов, помощь при движении." },
      { q: "Приезжает ли медсестра после операции?", a: "Да, HamshiraGo специализируется на постоперационном уходе: обработка швов, смена повязок, профилактика осложнений, контроль состояния. Медсестра приедет к вам домой по назначению врача." },
    ],
    ctaText: "Заказать уход на дому",
  },

  // ── UZ ────────────────────────────────────────────────────────────
  {
    slug: "ukol-uyda",
    lang: "uz",
    altLang: "ru",
    altSlug: "ukol-na-domu",
    breadcrumbLabel: "Uyda ukol",
    h1: "Toshkentda uyda ukol — hamshira chaqirish",
    title: "Toshkentda uyda ukol — 30 daqiqada hamshira | HamshiraGo",
    description:
      "Toshkentda uyga ukol qilish uchun hamshira chaqiring. Mushak va teri osti in'ektsiyalari, antibiotik, vitamin. Narxi 80 000 so'mdan. 30 daqiqada kelamiz, 24/7.",
    keywords:
      "uyda ukol Toshkent, hamshira ukol chaqirish, mushak ukoli uyda, antibiotik ukol uyda, vitamin ukol uyda, uyga hamshira ukol, hamshira narxi Toshkent, ukol na domu Tashkent",
    price: "80 000 so'mdan",
    intro:
      "HamshiraGo — Toshkentda uyga hamshira chaqirish xizmati. Ukol kerakmi? Poliklinikaga borish shart emas — tasdiqlangan hamshiramiz shifokor ko'rsatmasi asosida mushak yoki teri ostiga ukol qilish uchun uyingizga keladi. Kecha-kunduz 24 soat, haftada 7 kun ishlaymiz.",
    benefits: [
      { icon: "⚡", title: "30 daqiqada kelamiz", desc: "Buyurtma berganingizdan so'ng hamshira darhol yo'lga chiqadi. O'rtacha kelish vaqti 25–35 daqiqa." },
      { icon: "🔒", title: "Faqat bir martalik buyumlar", desc: "Steril igna, shprits va qo'lqoplar — hammasi bir martalik. To'liq xavfsizlik." },
      { icon: "🩺", title: "Tasdiqlangan hamshiralar", desc: "Har bir tibbiy xodim diplom, pasport va amaliyot litsenziyasini tekshirishdan o'tadi." },
      { icon: "🌙", title: "24/7", desc: "Kechasi, dam olish kunlari va bayramlarda ham buyurtma qabul qilamiz." },
      { icon: "💳", title: "Payme / Click", desc: "Ilovada qulay onlayn to'lov. Naqd pul kerak emas." },
      { icon: "📍", title: "Butun Toshkent", desc: "Yunusobod, Chilonzor, Mirzo Ulug'bek, Yakkasaroy va boshqa tumanlar." },
    ],
    faq: [
      { q: "Toshkentda uyda ukol qancha turadi?", a: "Uyda ukol narxi 80 000 so'mdan boshlanadi. Yakuniy narx muolaja murakkabligi va sutkaning vaqtiga qarab farq qilishi mumkin. Aniq narxni HamshiraGo ilovasida buyurtma berish jarayonida ko'rasiz." },
      { q: "Hamshira uyda qanday ukollarni qiladi?", a: "Hamshira shifokor ko'rsatmasi asosida istalgan ukol qiladi: antibiotiklar (seftriakson, penitsillin), vitaminlar (B12, B6), yallig'lanishga qarshi dorilar (diklofenok, ketorol), og'riq qoldiruvchilar, insulin va boshqalar." },
      { q: "Hamshira kelishidan oldin nima tayyorlash kerak?", a: "Shifokordan dori nomini, dozasini va yuborish usulini aniqlang. Ampula yoki flakoni tayyorlang. Hamshira shprits, igna, spirt va qo'lqoplarni o'zi olib keladi." },
      { q: "Hamshira qancha vaqtda keladi?", a: "Buyurtmani tasdiqlashdan so'ng hamshira o'rtacha 25–35 daqiqada keladi. Ilovada uning marshrutini xaritada real vaqtda ko'rasiz." },
      { q: "Kechasi va dam olish kunlari ham ishlaysizmi?", a: "Ha, HamshiraGo 24/7 ishlaydi — shu jumladan kechasi, shanba, yakshanba va O'zbekiston davlat bayramlarida ham." },
    ],
    ctaText: "Ukol uchun hamshira chaqirish",
  },
  {
    slug: "tomchi-uyda",
    lang: "uz",
    altLang: "ru",
    altSlug: "kapelnica-na-domu",
    breadcrumbLabel: "Uyda tomchi",
    h1: "Toshkentda uyda tomchi — hamshira chaqirish",
    title: "Toshkentda uyda tomchi — 30 daqiqada hamshira | HamshiraGo",
    description:
      "Toshkentda uyda tomchi qo'yish uchun hamshira chaqiring. Glyukoza, fiziologik eritma, vitaminlar. Narxi 150 000 so'mdan. 30 daqiqada kelamiz, 24/7.",
    keywords:
      "uyda tomchi Toshkent, tomchi qo'yish uyda, hamshira tomchi chaqirish, glyukoza tomchi uyda, fiziologik eritma uyda, vena ichiga tomchi uyda, tomchilatish uyda narxi, kapelnica na domu Tashkent",
    price: "150 000 so'mdan",
    intro:
      "Kasalxonaga bormasdan uyda tomchi qo'yishni xohlaysizmi? HamshiraGo Toshkentda tajribali hamshirani uyingizga yuboradi. Hamshira barcha kerakli uskunalarni olib keladi — tomchi sistemasi, glyukoza yoki fiziologik eritma — va uyda muolaja o'tkazadi.",
    benefits: [
      { icon: "⚡", title: "30 daqiqada hamshira", desc: "Buyurtmadan so'ng hamshira darhol yo'lga chiqadi. O'rtacha kelish vaqti 25–35 daqiqa." },
      { icon: "🩺", title: "Uskunani olib keladi", desc: "Hamshira steril tomchi sistemasi bilan keladi. Sizga faqat shifokor belgilagan dori kerak." },
      { icon: "🔒", title: "To'liq sterillik", desc: "Bir martalik sistemalar, qo'lqoplar va dezinfeksiya — tibbiy standartlarga qat'iy rioya." },
      { icon: "🌙", title: "24/7", desc: "Kechasi ham buyurtma qabul qilamiz." },
      { icon: "💳", title: "Payme / Click", desc: "Onlayn to'lov — qulay va xavfsiz." },
      { icon: "📍", title: "Butun Toshkent", desc: "Yunusobod, Chilonzor, Yakkasaroy, Mirzo Ulug'bek, Sergeli, Olmazor va boshqalar." },
    ],
    faq: [
      { q: "Toshkentda uyda tomchi qancha turadi?", a: "Uyda tomchi narxi 150 000 so'mdan boshlanadi. Narxga hamshira ishi va bir martalik sistema kiradi. Dori (standart to'plamga kirmaydigan bo'lsa) oldindan tayyorlanadi — buyurtmada aniqlashtiring." },
      { q: "Uyda tomchi uchun nima tayyorlash kerak?", a: "Shifokordan tomchi tarkibi, hajmi va yuborish tezligini aniqlang. Belgilangan dorini tayyorlang. Hamshira sistema, igna, plastir, qo'lqop va dezinfektant olib keladi." },
      { q: "Hamshira uyda qanday tomchilarni qo'yadi?", a: "Hamshira glyukoza, fiziologik eritma, B guruh vitaminlari, magneziya, natriy xlorid yoki shifokor ko'rsatmasi asosida boshqa dorilar bilan tomchi qo'yadi." },
      { q: "Uyda tomchi qancha vaqt davom etadi?", a: "Muolaja vaqti hajm va yuborish tezligiga qarab 30 daqiqadan 1,5 soatgacha davom etishi mumkin. Hamshira butun muolaja davomida bemorni kuzatib turadi." },
    ],
    ctaText: "Tomchi uchun hamshira chaqirish",
  },
  {
    slug: "qon-bosimi-ekz",
    lang: "uz",
    altLang: "ru",
    altSlug: "izmerenie-davleniya",
    breadcrumbLabel: "Qon bosimi va EKG",
    h1: "Toshkentda uyda qon bosimi va EKG o'lchash",
    title: "Toshkentda uyda qon bosimi va EKG | HamshiraGo",
    description:
      "Toshkentda uyda qon bosimi va EKG o'lchash uchun hamshira chaqiring. Navbatsiz, tez natija. Narxi 50 000 so'mdan. 24/7 ishlaymiz.",
    keywords:
      "qon bosimi uyda Toshkent, EKG uyda Toshkent, uyda EKG o'lchash, arterial bosim uyda, hamshira qon bosimi, elektrokardiogramma uyda, izmerenie davleniya doma Tashkent",
    price: "50 000 so'mdan",
    intro:
      "Gipertoniyaniz bormi yoki yurak og'rig'i bezovta qilyaptimi? HamshiraGo hamshirasi uyingizga kelib arterial qon bosimi va pulsni o'lchaydi, kerak bo'lsa EKG yozadi. Poliklinikaga bormasdan, navbat kutmasdan natijani qo'lingizga olasiz.",
    benefits: [
      { icon: "❤️", title: "Uyda qon bosimi nazorati", desc: "Professional tonometr, uch marta o'lchash — aniq natija." },
      { icon: "📊", title: "10 daqiqada EKG", desc: "Hamshira 12 kanalli EKG yozib, asosiy ko'rsatkichlarni tushuntiradi." },
      { icon: "🔒", title: "Tasdiqlangan tibbiy xodimlar", desc: "Har bir hamshira hujjat va litsenziya tekshiruvidan o'tgan." },
      { icon: "🌙", title: "24/7", desc: "Sog'lig'ingiz yomonlashsa — istalgan vaqtda buyurtma bering." },
      { icon: "💳", title: "Payme / Click", desc: "Ilovada onlayn to'lov." },
      { icon: "📍", title: "Butun Toshkent", desc: "Barcha tumanlar: Yunusobod, Mirzo Ulug'bek, Chilonzor, Yakkasaroy va boshqalar." },
    ],
    faq: [
      { q: "Uyda qon bosimi o'lchash qancha turadi?", a: "Arterial qon bosimi va pulsni uyda o'lchash 50 000 so'mdan boshlanadi. EKG alohida yoki birgalikda rasmiylashtirilishi mumkin — HamshiraGo ilovasida buyurtmada aniqlashtiring." },
      { q: "Uyda qon bosimi o'lchashdan oldin nima qilish kerak?", a: "O'lchashdan 30 daqiqa oldin chekmaslik, qahva ichmaslik, jismoniy faoliyat qilmaslik kerak. 5 daqiqa tinch o'tiring. Hamshira aniqlik uchun bir necha bor o'lchaydi." },
      { q: "Uyda EKG qanchalik aniq?", a: "Hamshira 12 qo'lga ega portativ professional elektrokardiograf ishlatadi — klinikadagi kabi aniq natija. So'rov bo'yicha kardiolog tomonidan izohlash ham mumkin." },
    ],
    ctaText: "Qon bosimi uchun hamshira chaqirish",
  },
  {
    slug: "uyda-parvarish",
    lang: "uz",
    altLang: "ru",
    altSlug: "uxod-na-domu",
    breadcrumbLabel: "Uyda parvarish",
    h1: "Toshkentda uyda bemor parvarishi — hamshira",
    title: "Toshkentda uyda bemor parvarishi | HamshiraGo",
    description:
      "Toshkentda keksalar va yotib qolgan bemorlar uchun uyda professional parvarish. Bog'lam almashtirish, operatsiyadan keyin reabilitatsiya. Narxi 200 000 so'mdan.",
    keywords:
      "uyda parvarish Toshkent, keksalar uyda parvarish, yotib qolgan bemor parvarishi, operatsiyadan keyin parvarish uyda, bog'lam almashtirish uyda, uyda tibbiy parvarish, uxod za bolnym doma Tashkent",
    price: "200 000 so'mdan",
    intro:
      "Kasalxonadan chiqqandan keyin yoki surunkali kasallik bilan uyda professional parvarish nihoyatda muhim. HamshiraGo Toshkentda keksalar va yotib qolgan bemorlar uchun malakali hamshira yuboradi: bog'lam almashtirish, yotoq yaralarining oldini olish, holat nazorati, jadval bo'yicha in'ektsiyalar.",
    benefits: [
      { icon: "🏥", title: "Doimiy yoki bir martalik parvarish", desc: "Har kungi tashrif yoki alohida muolajalarni belgilang — moslashuvchan jadval." },
      { icon: "🩹", title: "Bog'lam va yaralarni davolash", desc: "Operatsiya chandiqlarini steril davolash, trofik yaralar va yotoq yaralarini davolash." },
      { icon: "💊", title: "Jadval bo'yicha in'ektsiyalar", desc: "Shifokor belgilagan ukol yoki tomchi kursi — hamshira kerakli vaqtda keladi." },
      { icon: "👴", title: "Keksalar parvarishi", desc: "Gigiyena, qon bosimi nazorati, harakat paytida yordam — ehtiyotkorlik va professionallik bilan." },
      { icon: "🔒", title: "Tasdiqlangan tibbiy xodimlar", desc: "Har bir hamshira hujjatlar va litsenziyani tekshirishdan o'tgan." },
      { icon: "📍", title: "Butun Toshkent", desc: "Barcha tumanlar, shu jumladan atroflar — buyurtmada aniqlashtiring." },
    ],
    faq: [
      { q: "Toshkentda uyda parvarish qancha turadi?", a: "Uyda parvarish narxi tashrifga 200 000 so'mdan boshlanadi. Yakuniy narx muolajalar hajmi va tashrifning davomiyligiga bog'liq. Uzoq muddatli parvarish individual ravishda muhokama qilinadi." },
      { q: "Keksa qarindoshim uchun kundalik parvarishni qanday tashkil qilish mumkin?", a: "HamshiraGo ilovasida buyurtma bering, kerakli jadval va muolajalar ro'yxatini ko'rsating. Qulay vaqtda keladigan hamshira tayinlanadi." },
      { q: "Uyda parvarish xizmati nimalarga kiradi?", a: "Parvarishga quyidagilar kiradi: ertalabki gigiyena, yotoq yaralarining oldini olish va davolash, yaralarni bog'lash, jadval bo'yicha in'ektsiyalar, qon bosimi va haroratni o'lchash, yotib qolgan bemorlarni ovqatlantirish, harakatda yordam." },
      { q: "Operatsiyadan keyin hamshira kelishi mumkinmi?", a: "Ha, HamshiraGo operatsiyadan keyingi parvarishga ixtisoslashgan: tikuvlarni davolash, bog'lamlarni almashtirish, asoratlarning oldini olish, holatni nazorat qilish. Hamshira shifokor ko'rsatmasi asosida uyingizga keladi." },
    ],
    ctaText: "Uyda parvarish uchun hamshira chaqirish",
  },

  // ── РАЙОНЫ ТАШКЕНТА (RU) ─────────────────────────────────────────
  {
    slug: "tashkent-chilanzar",
    lang: "ru",
    altLang: "uz",
    altSlug: "toshkent-chilonzor",
    breadcrumbLabel: "Медик на дому Чиланзар",
    h1: "Медик на дому в Чиланзаре",
    title: "Медик на дому в Чиланзаре, Ташкент — за 30 минут | HamshiraGo",
    description:
      "Вызовите медика на дом в районе Чиланзар, Ташкент. Уколы, капельницы, измерение давления. Верифицированные медики приедут за 30 минут. 24/7.",
    keywords:
      "медик на дому Чиланзар, медсестра Чиланзар Ташкент, укол на дому Чиланзар, капельница дома Чиланзар, вызов медика Чиланзар, hamshira Chilonzor",
    price: "от 80 000 сум",
    intro:
      "HamshiraGo — сервис вызова медика на дом в районе Чиланзар. Наши верифицированные медики обслуживают все улицы Чиланзара и приедут за 30 минут после оформления заказа. Работаем 24/7.",
    benefits: [
      { icon: "📍", title: "Покрываем весь Чиланзар", desc: "Работаем во всех микрорайонах Чиланзара — от м. Чиланзар до Сергели." },
      { icon: "⚡", title: "За 30 минут", desc: "Медик выедет сразу после подтверждения заказа." },
      { icon: "🩺", title: "Уколы и капельницы", desc: "Все виды инъекций, капельницы, измерение давления и ЭКГ на дому." },
      { icon: "🌙", title: "24/7", desc: "Принимаем заказы круглосуточно, в том числе ночью и в праздники." },
      { icon: "🔒", title: "Верифицированные медики", desc: "Каждый медик проверен — диплом, паспорт, лицензия." },
      { icon: "💳", title: "Payme / Click", desc: "Оплата онлайн через приложение." },
    ],
    faq: [
      { q: "Работаете ли вы в Чиланзаре?", a: "Да, HamshiraGo обслуживает весь район Чиланзар — все микрорайоны и улицы. Медик приедет за 30 минут." },
      { q: "Какие услуги доступны в Чиланзаре?", a: "В Чиланзаре доступны все услуги: уколы, капельницы, измерение давления, ЭКГ, уход за больным на дому." },
      { q: "Работаете ли ночью в Чиланзаре?", a: "Да, работаем 24/7 включая ночное время и выходные дни." },
      { q: "Как вызвать медика в Чиланзаре?", a: "Оформите заказ через приложение HamshiraGo или сайт hamshirago.uz — укажите адрес в Чиланзаре и медик приедет за 30 минут." },
    ],
    ctaText: "Вызвать медика в Чиланзаре",
  },
  {
    slug: "tashkent-yunusabad",
    lang: "ru",
    altLang: "uz",
    altSlug: "toshkent-yunusobod",
    breadcrumbLabel: "Медик на дому Юнусабад",
    h1: "Медик на дому в Юнусабаде",
    title: "Медик на дому в Юнусабаде, Ташкент — за 30 минут | HamshiraGo",
    description:
      "Вызовите медика на дом в районе Юнусабад, Ташкент. Уколы, капельницы, измерение давления. Верифицированные медики приедут за 30 минут. 24/7.",
    keywords:
      "медик на дому Юнусабад, медсестра Юнусабад Ташкент, укол на дому Юнусабад, капельница дома Юнусабад, вызов медика Юнусабад, hamshira Yunusobod",
    price: "от 80 000 сум",
    intro:
      "HamshiraGo — сервис вызова медика на дом в районе Юнусабад. Наши верифицированные медики обслуживают все кварталы Юнусабада и приедут за 30 минут после оформления заказа. Работаем 24/7.",
    benefits: [
      { icon: "📍", title: "Покрываем весь Юнусабад", desc: "Работаем во всех кварталах Юнусабада — от массива Юнусабад до Яшнабада." },
      { icon: "⚡", title: "За 30 минут", desc: "Медик выедет сразу после подтверждения заказа." },
      { icon: "🩺", title: "Уколы и капельницы", desc: "Все виды инъекций, капельницы, измерение давления и ЭКГ на дому." },
      { icon: "🌙", title: "24/7", desc: "Принимаем заказы круглосуточно, в том числе ночью и в праздники." },
      { icon: "🔒", title: "Верифицированные медики", desc: "Каждый медик проверен — диплом, паспорт, лицензия." },
      { icon: "💳", title: "Payme / Click", desc: "Оплата онлайн через приложение." },
    ],
    faq: [
      { q: "Работаете ли вы в Юнусабаде?", a: "Да, HamshiraGo обслуживает весь район Юнусабад — все кварталы и улицы. Медик приедет за 30 минут." },
      { q: "Какие услуги доступны в Юнусабаде?", a: "В Юнусабаде доступны все услуги: уколы, капельницы, измерение давления, ЭКГ, уход за больным на дому." },
      { q: "Работаете ли ночью в Юнусабаде?", a: "Да, работаем 24/7 включая ночное время и выходные дни." },
      { q: "Как вызвать медика в Юнусабаде?", a: "Оформите заказ через приложение HamshiraGo или сайт hamshirago.uz — укажите адрес в Юнусабаде и медик приедет за 30 минут." },
    ],
    ctaText: "Вызвать медика в Юнусабаде",
  },
  {
    slug: "tashkent-mirzo-ulugbek",
    lang: "ru",
    altLang: "uz",
    altSlug: "toshkent-mirzo-ulugbek",
    breadcrumbLabel: "Медик на дому Мирзо-Улугбек",
    h1: "Медик на дому в Мирзо-Улугбеке",
    title: "Медик на дому в Мирзо-Улугбеке, Ташкент — за 30 минут | HamshiraGo",
    description:
      "Вызовите медика на дом в районе Мирзо-Улугбек, Ташкент. Уколы, капельницы, измерение давления. Верифицированные медики приедут за 30 минут. 24/7.",
    keywords:
      "медик на дому Мирзо-Улугбек, медсестра Мирзо-Улугбек Ташкент, укол на дому Мирзо-Улугбек, капельница дома Мирзо-Улугбек, вызов медика Мирзо-Улугбек, hamshira Mirzo Ulugbek",
    price: "от 80 000 сум",
    intro:
      "HamshiraGo — сервис вызова медика на дом в районе Мирзо-Улугбек. Наши верифицированные медики обслуживают все кварталы района и приедут за 30 минут после оформления заказа. Работаем 24/7.",
    benefits: [
      { icon: "📍", title: "Покрываем весь Мирзо-Улугбек", desc: "Работаем во всех кварталах района Мирзо-Улугбек, включая Дархан и Куйлюк." },
      { icon: "⚡", title: "За 30 минут", desc: "Медик выедет сразу после подтверждения заказа." },
      { icon: "🩺", title: "Уколы и капельницы", desc: "Все виды инъекций, капельницы, измерение давления и ЭКГ на дому." },
      { icon: "🌙", title: "24/7", desc: "Принимаем заказы круглосуточно, в том числе ночью и в праздники." },
      { icon: "🔒", title: "Верифицированные медики", desc: "Каждый медик проверен — диплом, паспорт, лицензия." },
      { icon: "💳", title: "Payme / Click", desc: "Оплата онлайн через приложение." },
    ],
    faq: [
      { q: "Работаете ли вы в Мирзо-Улугбеке?", a: "Да, HamshiraGo обслуживает весь район Мирзо-Улугбек — все кварталы и улицы. Медик приедет за 30 минут." },
      { q: "Какие услуги доступны в Мирзо-Улугбеке?", a: "В Мирзо-Улугбеке доступны все услуги: уколы, капельницы, измерение давления, ЭКГ, уход за больным на дому." },
      { q: "Работаете ли ночью в Мирзо-Улугбеке?", a: "Да, работаем 24/7 включая ночное время и выходные дни." },
      { q: "Как вызвать медика в Мирзо-Улугбеке?", a: "Оформите заказ через приложение HamshiraGo или сайт hamshirago.uz — укажите адрес в Мирзо-Улугбеке и медик приедет за 30 минут." },
    ],
    ctaText: "Вызвать медика в Мирзо-Улугбеке",
  },
  {
    slug: "tashkent-yakkasaray",
    lang: "ru",
    altLang: "uz",
    altSlug: "toshkent-yakkasaroy",
    breadcrumbLabel: "Медик на дому Яккасарай",
    h1: "Медик на дому в Яккасарае",
    title: "Медик на дому в Яккасарае, Ташкент — за 30 минут | HamshiraGo",
    description:
      "Вызовите медика на дом в районе Яккасарай, Ташкент. Уколы, капельницы, измерение давления. Верифицированные медики приедут за 30 минут. 24/7.",
    keywords:
      "медик на дому Яккасарай, медсестра Яккасарай Ташкент, укол на дому Яккасарай, капельница дома Яккасарай, вызов медика Яккасарай, hamshira Yakkasaroy",
    price: "от 80 000 сум",
    intro:
      "HamshiraGo — сервис вызова медика на дом в районе Яккасарай. Наши верифицированные медики обслуживают все улицы района и приедут за 30 минут после оформления заказа. Работаем 24/7.",
    benefits: [
      { icon: "📍", title: "Покрываем весь Яккасарай", desc: "Работаем во всех кварталах района Яккасарай, включая центральные улицы Ташкента." },
      { icon: "⚡", title: "За 30 минут", desc: "Медик выедет сразу после подтверждения заказа." },
      { icon: "🩺", title: "Уколы и капельницы", desc: "Все виды инъекций, капельницы, измерение давления и ЭКГ на дому." },
      { icon: "🌙", title: "24/7", desc: "Принимаем заказы круглосуточно, в том числе ночью и в праздники." },
      { icon: "🔒", title: "Верифицированные медики", desc: "Каждый медик проверен — диплом, паспорт, лицензия." },
      { icon: "💳", title: "Payme / Click", desc: "Оплата онлайн через приложение." },
    ],
    faq: [
      { q: "Работаете ли вы в Яккасарае?", a: "Да, HamshiraGo обслуживает весь район Яккасарай — все кварталы и улицы. Медик приедет за 30 минут." },
      { q: "Какие услуги доступны в Яккасарае?", a: "В Яккасарае доступны все услуги: уколы, капельницы, измерение давления, ЭКГ, уход за больным на дому." },
      { q: "Работаете ли ночью в Яккасарае?", a: "Да, работаем 24/7 включая ночное время и выходные дни." },
      { q: "Как вызвать медика в Яккасарае?", a: "Оформите заказ через приложение HamshiraGo или сайт hamshirago.uz — укажите адрес в Яккасарае и медик приедет за 30 минут." },
    ],
    ctaText: "Вызвать медика в Яккасарае",
  },

  // ── РАЙОНЫ ТАШКЕНТА (UZ) ─────────────────────────────────────────
  {
    slug: "toshkent-chilonzor",
    lang: "uz",
    altLang: "ru",
    altSlug: "tashkent-chilanzar",
    breadcrumbLabel: "Chilonzorda uyda hamshira",
    h1: "Chilonzorda uyda hamshira chaqirish",
    title: "Chilonzorda uyda hamshira — 30 daqiqada | HamshiraGo",
    description:
      "Toshkent Chilonzor tumanida uyga hamshira chaqiring. Ukol, tomchi, qon bosimi o'lchash. Tasdiqlangan hamshiralar 30 daqiqada keladi. 24/7.",
    keywords:
      "hamshira Chilonzor, uyda hamshira Chilonzor Toshkent, ukol uyda Chilonzor, tomchi uyda Chilonzor, hamshira chaqirish Chilonzor, medik na domu Chilanzar",
    price: "80 000 so'mdan",
    intro:
      "HamshiraGo — Toshkent Chilonzor tumanida uyga hamshira chaqirish xizmati. Tasdiqlangan hamshiralarimiz Chilonzorning barcha ko'chalarini qamrab oladi va buyurtmadan 30 daqiqa ichida keladi. 24/7 ishlaymiz.",
    benefits: [
      { icon: "📍", title: "Butun Chilonzorni qamrab olamiz", desc: "Chilonzorning barcha massivlarida ishlaymiz — Chilonzor metrosidan Sergeligacha." },
      { icon: "⚡", title: "30 daqiqada", desc: "Buyurtma tasdiqlanganidan so'ng hamshira darhol yo'lga chiqadi." },
      { icon: "🩺", title: "Ukol va tomchi", desc: "Barcha turdagi in'ektsiyalar, tomchi, qon bosimi o'lchash va EKG uyda." },
      { icon: "🌙", title: "24/7", desc: "Kecha-kunduz buyurtma qabul qilamiz, shu jumladan kechasi va bayramlarda." },
      { icon: "🔒", title: "Tasdiqlangan hamshiralar", desc: "Har bir hamshira tekshirilgan — diplom, pasport, litsenziya." },
      { icon: "💳", title: "Payme / Click", desc: "Ilovada onlayn to'lov." },
    ],
    faq: [
      { q: "Chilonzorda xizmat ko'rsatasizmi?", a: "Ha, HamshiraGo Chilonzor tumanining barcha massivi va ko'chalarini qamrab oladi. Hamshira 30 daqiqada keladi." },
      { q: "Chilonzorda qanday xizmatlar mavjud?", a: "Chilonzorda barcha xizmatlar mavjud: ukol, tomchi, qon bosimi o'lchash, EKG, uyda bemor parvarishi." },
      { q: "Chilonzorda kechasi ham ishlaysizmi?", a: "Ha, 24/7 ishlaymiz, shu jumladan kechasi va dam olish kunlari." },
      { q: "Chilonzorda hamshirani qanday chaqirish mumkin?", a: "HamshiraGo ilovasi yoki hamshirago.uz saytida buyurtma bering — Chilonzordagi manzilingizni ko'rsating va hamshira 30 daqiqada keladi." },
    ],
    ctaText: "Chilonzorda hamshira chaqirish",
  },
  {
    slug: "toshkent-yunusobod",
    lang: "uz",
    altLang: "ru",
    altSlug: "tashkent-yunusabad",
    breadcrumbLabel: "Yunusobodda uyda hamshira",
    h1: "Yunusobodda uyda hamshira chaqirish",
    title: "Yunusobodda uyda hamshira — 30 daqiqada | HamshiraGo",
    description:
      "Toshkent Yunusobod tumanida uyga hamshira chaqiring. Ukol, tomchi, qon bosimi o'lchash. Tasdiqlangan hamshiralar 30 daqiqada keladi. 24/7.",
    keywords:
      "hamshira Yunusobod, uyda hamshira Yunusobod Toshkent, ukol uyda Yunusobod, tomchi uyda Yunusobod, hamshira chaqirish Yunusobod, medik na domu Yunusabad",
    price: "80 000 so'mdan",
    intro:
      "HamshiraGo — Toshkent Yunusobod tumanida uyga hamshira chaqirish xizmati. Tasdiqlangan hamshiralarimiz Yunusobodning barcha kvartallarini qamrab oladi va buyurtmadan 30 daqiqa ichida keladi. 24/7 ishlaymiz.",
    benefits: [
      { icon: "📍", title: "Butun Yunusobodni qamrab olamiz", desc: "Yunusobodning barcha kvartallarida ishlaymiz — Yunusobod massividan Yashnabodgacha." },
      { icon: "⚡", title: "30 daqiqada", desc: "Buyurtma tasdiqlanganidan so'ng hamshira darhol yo'lga chiqadi." },
      { icon: "🩺", title: "Ukol va tomchi", desc: "Barcha turdagi in'ektsiyalar, tomchi, qon bosimi o'lchash va EKG uyda." },
      { icon: "🌙", title: "24/7", desc: "Kecha-kunduz buyurtma qabul qilamiz, shu jumladan kechasi va bayramlarda." },
      { icon: "🔒", title: "Tasdiqlangan hamshiralar", desc: "Har bir hamshira tekshirilgan — diplom, pasport, litsenziya." },
      { icon: "💳", title: "Payme / Click", desc: "Ilovada onlayn to'lov." },
    ],
    faq: [
      { q: "Yunusobodda xizmat ko'rsatasizmi?", a: "Ha, HamshiraGo Yunusobod tumanining barcha kvartallari va ko'chalarini qamrab oladi. Hamshira 30 daqiqada keladi." },
      { q: "Yunusobodda qanday xizmatlar mavjud?", a: "Yunusobodda barcha xizmatlar mavjud: ukol, tomchi, qon bosimi o'lchash, EKG, uyda bemor parvarishi." },
      { q: "Yunusobodda kechasi ham ishlaysizmi?", a: "Ha, 24/7 ishlaymiz, shu jumladan kechasi va dam olish kunlari." },
      { q: "Yunusobodda hamshirani qanday chaqirish mumkin?", a: "HamshiraGo ilovasi yoki hamshirago.uz saytida buyurtma bering — Yunusobodagi manzilingizni ko'rsating va hamshira 30 daqiqada keladi." },
    ],
    ctaText: "Yunusobodda hamshira chaqirish",
  },
  {
    slug: "toshkent-mirzo-ulugbek",
    lang: "uz",
    altLang: "ru",
    altSlug: "tashkent-mirzo-ulugbek",
    breadcrumbLabel: "Mirzo Ulug'bekda uyda hamshira",
    h1: "Mirzo Ulug'bekda uyda hamshira chaqirish",
    title: "Mirzo Ulug'bekda uyda hamshira — 30 daqiqada | HamshiraGo",
    description:
      "Toshkent Mirzo Ulug'bek tumanida uyga hamshira chaqiring. Ukol, tomchi, qon bosimi o'lchash. Tasdiqlangan hamshiralar 30 daqiqada keladi. 24/7.",
    keywords:
      "hamshira Mirzo Ulugbek, uyda hamshira Mirzo Ulugbek Toshkent, ukol uyda Mirzo Ulugbek, tomchi uyda Mirzo Ulugbek, hamshira chaqirish Mirzo Ulugbek, medik na domu Mirzo-Ulugbek",
    price: "80 000 so'mdan",
    intro:
      "HamshiraGo — Toshkent Mirzo Ulug'bek tumanida uyga hamshira chaqirish xizmati. Tasdiqlangan hamshiralarimiz tumanning barcha kvartallarini qamrab oladi va buyurtmadan 30 daqiqa ichida keladi. 24/7 ishlaymiz.",
    benefits: [
      { icon: "📍", title: "Butun Mirzo Ulug'bekni qamrab olamiz", desc: "Mirzo Ulug'bek tumanining barcha kvartallarida ishlaymiz, shu jumladan Darxon va Qo'yliq." },
      { icon: "⚡", title: "30 daqiqada", desc: "Buyurtma tasdiqlanganidan so'ng hamshira darhol yo'lga chiqadi." },
      { icon: "🩺", title: "Ukol va tomchi", desc: "Barcha turdagi in'ektsiyalar, tomchi, qon bosimi o'lchash va EKG uyda." },
      { icon: "🌙", title: "24/7", desc: "Kecha-kunduz buyurtma qabul qilamiz, shu jumladan kechasi va bayramlarda." },
      { icon: "🔒", title: "Tasdiqlangan hamshiralar", desc: "Har bir hamshira tekshirilgan — diplom, pasport, litsenziya." },
      { icon: "💳", title: "Payme / Click", desc: "Ilovada onlayn to'lov." },
    ],
    faq: [
      { q: "Mirzo Ulug'bekda xizmat ko'rsatasizmi?", a: "Ha, HamshiraGo Mirzo Ulug'bek tumanining barcha kvartallari va ko'chalarini qamrab oladi. Hamshira 30 daqiqada keladi." },
      { q: "Mirzo Ulug'bekda qanday xizmatlar mavjud?", a: "Mirzo Ulug'bekda barcha xizmatlar mavjud: ukol, tomchi, qon bosimi o'lchash, EKG, uyda bemor parvarishi." },
      { q: "Mirzo Ulug'bekda kechasi ham ishlaysizmi?", a: "Ha, 24/7 ishlaymiz, shu jumladan kechasi va dam olish kunlari." },
      { q: "Mirzo Ulug'bekda hamshirani qanday chaqirish mumkin?", a: "HamshiraGo ilovasi yoki hamshirago.uz saytida buyurtma bering — Mirzo Ulug'bekdagi manzilingizni ko'rsating va hamshira 30 daqiqada keladi." },
    ],
    ctaText: "Mirzo Ulug'bekda hamshira chaqirish",
  },
  {
    slug: "toshkent-yakkasaroy",
    lang: "uz",
    altLang: "ru",
    altSlug: "tashkent-yakkasaray",
    breadcrumbLabel: "Yakkasaroyda uyda hamshira",
    h1: "Yakkasaroyda uyda hamshira chaqirish",
    title: "Yakkasaroyda uyda hamshira — 30 daqiqada | HamshiraGo",
    description:
      "Toshkent Yakkasaroy tumanida uyga hamshira chaqiring. Ukol, tomchi, qon bosimi o'lchash. Tasdiqlangan hamshiralar 30 daqiqada keladi. 24/7.",
    keywords:
      "hamshira Yakkasaroy, uyda hamshira Yakkasaroy Toshkent, ukol uyda Yakkasaroy, tomchi uyda Yakkasaroy, hamshira chaqirish Yakkasaroy, medik na domu Yakkasaray",
    price: "80 000 so'mdan",
    intro:
      "HamshiraGo — Toshkent Yakkasaroy tumanida uyga hamshira chaqirish xizmati. Tasdiqlangan hamshiralarimiz tumanning barcha ko'chalarini qamrab oladi va buyurtmadan 30 daqiqa ichida keladi. 24/7 ishlaymiz.",
    benefits: [
      { icon: "📍", title: "Butun Yakkasaroyni qamrab olamiz", desc: "Yakkasaroy tumanining barcha kvartallarida ishlaymiz, shu jumladan Toshkentning markaziy ko'chalari." },
      { icon: "⚡", title: "30 daqiqada", desc: "Buyurtma tasdiqlanganidan so'ng hamshira darhol yo'lga chiqadi." },
      { icon: "🩺", title: "Ukol va tomchi", desc: "Barcha turdagi in'ektsiyalar, tomchi, qon bosimi o'lchash va EKG uyda." },
      { icon: "🌙", title: "24/7", desc: "Kecha-kunduz buyurtma qabul qilamiz, shu jumladan kechasi va bayramlarda." },
      { icon: "🔒", title: "Tasdiqlangan hamshiralar", desc: "Har bir hamshira tekshirilgan — diplom, pasport, litsenziya." },
      { icon: "💳", title: "Payme / Click", desc: "Ilovada onlayn to'lov." },
    ],
    faq: [
      { q: "Yakkasaroyda xizmat ko'rsatasizmi?", a: "Ha, HamshiraGo Yakkasaroy tumanining barcha kvartallari va ko'chalarini qamrab oladi. Hamshira 30 daqiqada keladi." },
      { q: "Yakkasaroyda qanday xizmatlar mavjud?", a: "Yakkasaroyda barcha xizmatlar mavjud: ukol, tomchi, qon bosimi o'lchash, EKG, uyda bemor parvarishi." },
      { q: "Yakkasaroyda kechasi ham ishlaysizmi?", a: "Ha, 24/7 ishlaymiz, shu jumladan kechasi va dam olish kunlari." },
      { q: "Yakkasaroyda hamshirani qanday chaqirish mumkin?", a: "HamshiraGo ilovasi yoki hamshirago.uz saytida buyurtma bering — Yakkasaroydagi manzilingizni ko'rsating va hamshira 30 daqiqada keladi." },
    ],
    ctaText: "Yakkasaroyda hamshira chaqirish",
  },
];

/* ── Helpers ────────────────────────────────────────────────────── */
function getService(lang: string, service: string): ServiceInfo | null {
  return SERVICES.find((s) => s.lang === lang && s.slug === service) ?? null;
}

/* ── generateStaticParams ───────────────────────────────────────── */
export function generateStaticParams() {
  return SERVICES.map((s) => ({ lang: s.lang, service: s.slug }));
}

/* ── Metadata ────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; service: string }>;
}): Promise<Metadata> {
  const { lang, service } = await params;
  const s = getService(lang, service);
  if (!s) return {};

  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: {
      canonical: `${SITE_URL}/${s.lang}/${s.slug}`,
      languages: {
        [s.lang]: `${SITE_URL}/${s.lang}/${s.slug}`,
        [s.altLang]: `${SITE_URL}/${s.altLang}/${s.altSlug}`,
        "x-default": `${SITE_URL}/ru/${s.lang === "ru" ? s.slug : s.altSlug}`,
      },
    },
    openGraph: {
      title: s.h1,
      description: s.description,
      url: `${SITE_URL}/${s.lang}/${s.slug}`,
      siteName: "HamshiraGo",
      type: "website",
      locale: s.lang === "uz" ? "uz_UZ" : "ru_RU",
      images: [{ url: `${SITE_URL}/${s.lang}/opengraph-image`, width: 1200, height: 630, alt: s.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: s.h1,
      description: s.description,
      images: [`${SITE_URL}/${s.lang}/opengraph-image`],
    },
    robots: { index: true, follow: true },
  };
}

/* ── Page component ─────────────────────────────────────────────── */
export default async function ServicePage({
  params,
}: {
  params: Promise<{ lang: string; service: string }>;
}) {
  const { lang, service } = await params;
  const s = getService(lang, service);
  if (!s) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "HamshiraGo", item: `${SITE_URL}/${s.lang}` },
          { "@type": "ListItem", position: 2, name: s.breadcrumbLabel, item: `${SITE_URL}/${s.lang}/${s.slug}` },
        ],
      },
      {
        "@type": "MedicalProcedure",
        name: s.h1,
        description: s.description,
        provider: {
          "@type": "MedicalBusiness",
          name: "HamshiraGo",
          url: `${SITE_URL}/${s.lang}`,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
          areaServed: { "@type": "City", name: s.lang === "uz" ? "Toshkent" : "Ташкент" },
          openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "00:00", closes: "23:59" },
        },
        offers: {
          "@type": "Offer",
          price: s.price.replace(/[^0-9]/g, ""),
          priceCurrency: "UZS",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500", bestRating: "5" },
      },
      {
        "@type": "FAQPage",
        mainEntity: s.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  const backLabel = s.lang === "ru" ? "← На главную" : "← Bosh sahifaga";

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Link href={`/${s.lang}`} style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            {backLabel}
          </Link>
          <Link href={`/${s.lang}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="HamshiraGo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>HamshiraGo</span>
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 24px", fontSize: 13, color: "#64748b" }}>
        <Link href={`/${s.lang}`} style={{ color: "#0d9488", textDecoration: "none", fontWeight: 500 }}>HamshiraGo</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span>{s.breadcrumbLabel}</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(8,145,178,0.05))", border: "1px solid rgba(13,148,136,0.15)", borderRadius: 20, padding: "40px 32px", marginBottom: 32 }}>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 900, color: "#0f172a", lineHeight: 1.15, marginBottom: 16 }}>
            {s.h1}
          </h1>
          <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, marginBottom: 24, maxWidth: 680 }}>
            {s.intro}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "10px 18px", border: "1px solid rgba(13,148,136,0.2)", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0d9488" }}>{s.price}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#64748b" }}>
              <span>⚡</span>
              <span style={{ fontWeight: 600 }}>{s.lang === "ru" ? "30 мин" : "30 daqiqa"}</span>
              <span>·</span>
              <span>24/7</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <a
            href="https://app.hamshirago.uz"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #0d9488, #0891b2)",
              color: "#fff", fontSize: 17, fontWeight: 800,
              padding: "18px 36px", borderRadius: 16,
              textDecoration: "none",
              boxShadow: "0 8px 28px rgba(13,148,136,0.4)",
            }}
          >
            <span>📱</span>
            {s.ctaText}
          </a>
          <p style={{ marginTop: 10, fontSize: 13, color: "#94a3b8" }}>
            {s.lang === "ru" ? "Работаем 24/7 · Оплата Payme / Click" : "24/7 ishlaymiz · Payme / Click orqali to'lov"}
          </p>
        </div>

        {/* Benefits */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
          {s.lang === "ru" ? "Почему выбирают HamshiraGo" : "Nima uchun HamshiraGo"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 48 }}>
          {s.benefits.map((b, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{b.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 4 }}>{b.title}</p>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
          {s.lang === "ru" ? "Часто задаваемые вопросы" : "Ko'p so'raladigan savollar"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {s.faq.map((item, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <details>
                <summary style={{ padding: "18px 20px", fontWeight: 700, color: "#0f172a", fontSize: 15, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {item.q}
                  <span style={{ fontSize: 18, color: "#0d9488", flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <div style={{ padding: "0 20px 18px", fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              </details>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(8,145,178,0.07))", border: "1px solid rgba(13,148,136,0.2)", borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
            {s.lang === "ru" ? "Готовы вызвать медика?" : "Hamshira chaqirishga tayyormisiz?"}
          </p>
          <p style={{ fontSize: 15, color: "#64748b", marginBottom: 24 }}>
            {s.lang === "ru"
              ? "Откройте приложение — медсестра приедет в течение 30 минут"
              : "Ilovani oching — hamshira 30 daqiqa ichida keladi"}
          </p>
          <a
            href="https://app.hamshirago.uz"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #0d9488, #0891b2)",
              color: "#fff", fontSize: 16, fontWeight: 800,
              padding: "16px 32px", borderRadius: 14,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(13,148,136,0.35)",
            }}
          >
            {s.ctaText}
          </a>
        </div>

      </div>
    </main>
  );
}
