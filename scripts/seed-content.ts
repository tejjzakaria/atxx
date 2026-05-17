import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const STORE_ID = "69fce8c3500a2de9b1f1e79c";

const content = {
  en: {
    home: {
      hero: {
        headline: "Own Your Allure",
        subtext: "Scents crafted to turn heads and leave a lasting impression.",
        ctaText: "Shop Now",
        socialProof: "4.5/5 From 125,000+ Customers",
      },
      about: {
        headline: "About Venom",
        body: "At Venom, we're more than just a perfume brand — we're a movement. Born from the obsession with leaving a mark, every bottle we craft is a weapon of elegance. We believe scent is the most intimate accessory you own, and we're here to make sure yours turns heads, sparks conversations, and lingers long after you've left the room.",
        ctaText: "Shop Now",
      },
      testimonials: {
        headlineBold: "Women",
        headlineItalic: "Speak Up",
        stats: [
          { percent: "93%", text: "of women received more compliments after switching to Venom" },
          { percent: "88%", text: "reported their scent lasting over 8 hours on skin" },
          { percent: "97%", text: "said they would recommend Venom to a friend" },
        ],
      },
      benefits: {
        headlineBold: "Unlock the Secret to",
        headlineItalic: "Timeless Charm",
        items: [
          {
            title: "Long-Lasting Formula",
            description: "Up to 12 hours of intense sillage — from the first meeting to the last dance, your scent never fades.",
          },
          {
            title: "Skin-Safe Ingredients",
            description: "Crafted with dermatologist-approved ingredients. Bold fragrance, zero compromise on your skin's health.",
          },
          {
            title: "Signature Sillage",
            description: "Our unique concentration blend ensures you leave a trail — the kind people remember and ask about.",
          },
        ],
      },
      reviews: {
        headlineBold: "Proof in Every",
        headlineItalic: "Compliment.",
        subtitle: "Hear from women who've seen the spark, the stares, and the chemistry in action.",
        totalReviews: "3,091 Reviews",
      },
    },
    about: {
      hero: {
        eyebrow: "Our Story",
        headline: "Scent That Speaks Before You Do",
        subtitle: "Venom was built on a single conviction — that the right fragrance doesn't just complement who you are, it announces it.",
      },
      stats: [
        { value: "125K+", label: "Happy Customers" },
        { value: "4.8★",  label: "Average Rating" },
        { value: "12+",   label: "Signature Scents" },
        { value: "3yr",   label: "Of Craftsmanship" },
      ],
      mission: {
        eyebrow: "Why We Exist",
        headlineBold: "We Didn't Create a Perfume.",
        headlineItalic: "We Created a Feeling.",
        body1: "Most fragrances are designed to smell pleasant. We designed ours to make you unforgettable. There's a difference between wearing a perfume and owning a signature — and Venom was built to give every woman the latter.",
        body2: "That obsession drove three years of research, reformulation, and relentless testing. We worked with master perfumers to create scents that don't just sit on your skin — they move with you, evolve through the day, and leave an impression that lasts long after you've gone.",
        ctaText: "Explore the Collection",
      },
      values: {
        eyebrow: "What We Stand For",
        headlineBold: "Built on",
        headlineItalic: "Principles, Not Trends",
        items: [
          {
            title: "Craftsmanship First",
            description: "Every formula is refined until it's exceptional. We don't rush to market — we wait until it's right.",
          },
          {
            title: "Radical Transparency",
            description: "We tell you exactly what's in every bottle. No hidden synthetics, no misleading claims.",
          },
          {
            title: "Women-Led Vision",
            description: "Built by women, for women. Every decision we make starts with the question: does this serve her?",
          },
        ],
      },
      timeline: {
        eyebrow: "How We Got Here",
        headlineBold: "The",
        headlineItalic: "Venom Journey",
        items: [
          {
            year: "2022",
            title: "The Obsession Begins",
            text: "A late-night conversation about why no perfume felt truly powerful sparked the idea that would become Venom.",
          },
          {
            year: "2023",
            title: "Three Years in the Making",
            text: "We partnered with master perfumers and spent months testing over 60 formulations before finding the one.",
          },
          {
            year: "2024",
            title: "The First Drop",
            text: "Venom launched with 3 signature scents. Within 72 hours, the first batch sold out completely.",
          },
          {
            year: "2025",
            title: "A Movement, Not a Brand",
            text: "125,000+ customers, 12 signature scents, and a community of women who refuse to go unnoticed.",
          },
        ],
      },
      cta: {
        headline: "Ready to Own Your Allure?",
        subtitle: "Discover the collection crafted to turn heads, spark chemistry, and leave your mark on every room you enter.",
        primaryCta: "Shop the Collection",
        secondaryCta: "Back to Home",
      },
    },
    contact: {
      instagram: "@venomscents",
      tiktok: "@venomscents",
    },
    product: {
      howToUse: {
        eyebrow: "Application Guide",
        headline: "How to Get the Most Out of Your Scent",
        steps: [
          {
            step: "01",
            title: "Apply to Pulse Points",
            description: "Spritz on your wrists, neck, behind the ears, and inner elbows — these warm zones amplify your scent and radiate it throughout the day.",
          },
          {
            step: "02",
            title: "Don't Rub, Let It Breathe",
            description: "After applying, resist the urge to rub your wrists together. Rubbing breaks the top notes and flattens the scent's natural evolution.",
          },
          {
            step: "03",
            title: "Layer for Longevity",
            description: "Apply to freshly moisturised skin or layer with an unscented body lotion to lock in the fragrance and dramatically extend its wear.",
          },
          {
            step: "04",
            title: "Spray from a Distance",
            description: "Hold the bottle 10–15 cm from your skin and spray in a sweeping motion. This creates an even mist that settles naturally.",
          },
        ],
      },
      whyUs: {
        eyebrow: "Why Venom",
        headline: "Crafted to a Different Standard",
        items: [
          {
            title: "12-Hour Sillage",
            description: "Our proprietary concentration keeps your scent alive from morning to midnight — no touch-ups, no fading.",
          },
          {
            title: "Dermatologist Approved",
            description: "Every formula is tested for skin safety. Bold scent, zero compromise on the health of your skin.",
          },
          {
            title: "Master Perfumers",
            description: "Each scent is developed alongside internationally recognised perfumers with decades of experience in luxury fragrance.",
          },
          {
            title: "Ethically Sourced",
            description: "Our raw materials are sourced sustainably, with no animal testing and full ingredient transparency in every bottle.",
          },
        ],
      },
    },
  },

  fr: {
    home: {
      hero: {
        headline: "Révélez Votre Allure",
        subtext: "Des parfums créés pour attirer les regards et laisser une impression inoubliable.",
        ctaText: "Acheter Maintenant",
        socialProof: "4.5/5 d'après 125 000+ clientes",
      },
      about: {
        headline: "À Propos de Venom",
        body: "Chez Venom, nous sommes bien plus qu'une marque de parfums — nous sommes un mouvement. Née de l'obsession de laisser une empreinte, chaque bouteille que nous créons est une arme d'élégance. Nous croyons que le parfum est l'accessoire le plus intime que vous possédez, et nous sommes là pour vous assurer que le vôtre attire les regards, éveille les conversations, et reste bien après que vous ayez quitté la pièce.",
        ctaText: "Acheter Maintenant",
      },
      testimonials: {
        headlineBold: "Les Femmes",
        headlineItalic: "Parlent",
        stats: [
          { percent: "93%", text: "des femmes ont reçu plus de compliments après être passées à Venom" },
          { percent: "88%", text: "ont constaté que leur parfum durait plus de 8 heures" },
          { percent: "97%", text: "recommanderaient Venom à une amie" },
        ],
      },
      benefits: {
        headlineBold: "Découvrez le Secret du",
        headlineItalic: "Charme Éternel",
        items: [
          {
            title: "Formule Longue Durée",
            description: "Jusqu'à 12 heures de sillage intense — de la première rencontre à la dernière danse, votre parfum ne faiblit jamais.",
          },
          {
            title: "Ingrédients Sûrs pour la Peau",
            description: "Formulé avec des ingrédients approuvés par les dermatologues. Un parfum audacieux, sans compromis pour votre peau.",
          },
          {
            title: "Sillage Signature",
            description: "Notre mélange de concentration unique vous assure de laisser une trace — celle dont on se souvient et que l'on demande.",
          },
        ],
      },
      reviews: {
        headlineBold: "La Preuve dans Chaque",
        headlineItalic: "Compliment.",
        subtitle: "Écoutez les femmes qui ont vécu l'étincelle, les regards et la chimie en action.",
        totalReviews: "3 091 Avis",
      },
    },
    about: {
      hero: {
        eyebrow: "Notre Histoire",
        headline: "Un Parfum Qui Parle Avant Vous",
        subtitle: "Venom est né d'une conviction profonde — que le bon parfum ne complète pas simplement qui vous êtes, il l'annonce.",
      },
      stats: [
        { value: "125K+", label: "Clientes Satisfaites" },
        { value: "4.8★",  label: "Note Moyenne" },
        { value: "12+",   label: "Parfums Signature" },
        { value: "3 ans", label: "De Savoir-Faire" },
      ],
      mission: {
        eyebrow: "Pourquoi Nous Existons",
        headlineBold: "Nous N'avons Pas Créé un Parfum.",
        headlineItalic: "Nous Avons Créé un Sentiment.",
        body1: "La plupart des parfums sont conçus pour sentir bon. Nous avons conçu les nôtres pour vous rendre inoubliable. Il y a une différence entre porter un parfum et posséder une signature — et Venom a été créé pour donner à chaque femme cette dernière.",
        body2: "Cette obsession a conduit à trois ans de recherche, de reformulation et de tests incessants. Nous avons travaillé avec des maîtres parfumeurs pour créer des senteurs qui ne restent pas simplement sur votre peau — elles se déplacent avec vous, évoluent tout au long de la journée, et laissent une impression qui dure longtemps après votre départ.",
        ctaText: "Explorer la Collection",
      },
      values: {
        eyebrow: "Ce Pour Quoi Nous Nous Battons",
        headlineBold: "Construit sur des",
        headlineItalic: "Principes, Pas des Tendances",
        items: [
          {
            title: "L'Artisanat Avant Tout",
            description: "Chaque formule est affinée jusqu'à l'excellence. Nous ne nous précipitons pas sur le marché — nous attendons que ce soit parfait.",
          },
          {
            title: "Transparence Totale",
            description: "Nous vous disons exactement ce qui se trouve dans chaque flacon. Pas de synthétiques cachés, pas d'allégations trompeuses.",
          },
          {
            title: "Vision Féminine",
            description: "Créé par des femmes, pour des femmes. Chaque décision commence par la question : est-ce que cela lui sert ?",
          },
        ],
      },
      timeline: {
        eyebrow: "Comment Nous En Sommes Arrivés Là",
        headlineBold: "Le",
        headlineItalic: "Parcours Venom",
        items: [
          {
            year: "2022",
            title: "L'Obsession Commence",
            text: "Une conversation tardive sur pourquoi aucun parfum ne semblait vraiment puissant a fait naître l'idée qui deviendrait Venom.",
          },
          {
            year: "2023",
            title: "Trois Ans de Création",
            text: "Nous avons collaboré avec des maîtres parfumeurs et passé des mois à tester plus de 60 formulations avant de trouver la bonne.",
          },
          {
            year: "2024",
            title: "Le Premier Lancement",
            text: "Venom a lancé avec 3 parfums signature. En 72 heures, le premier lot s'était complètement vendu.",
          },
          {
            year: "2025",
            title: "Un Mouvement, Pas une Marque",
            text: "Plus de 125 000 clientes, 12 parfums signature, et une communauté de femmes qui refusent de passer inaperçues.",
          },
        ],
      },
      cta: {
        headline: "Prête à Révéler Votre Allure ?",
        subtitle: "Découvrez la collection créée pour attirer les regards, éveiller la chimie et laisser votre empreinte dans chaque pièce.",
        primaryCta: "Acheter la Collection",
        secondaryCta: "Retour à l'Accueil",
      },
    },
    contact: {
      instagram: "@venomscents",
      tiktok: "@venomscents",
    },
    product: {
      howToUse: {
        eyebrow: "Guide d'Application",
        headline: "Comment Tirer le Meilleur de Votre Parfum",
        steps: [
          {
            step: "01",
            title: "Appliquer sur les Points de Pulsation",
            description: "Vaporisez sur vos poignets, votre nuque, derrière les oreilles et à l'intérieur des coudes — ces zones chaudes amplifient votre parfum tout au long de la journée.",
          },
          {
            step: "02",
            title: "Ne Frottez Pas, Laissez Respirer",
            description: "Après l'application, résistez à l'envie de frotter vos poignets ensemble. Le frottement brise les notes de tête et écrase l'évolution naturelle du parfum.",
          },
          {
            step: "03",
            title: "Superposez pour la Longévité",
            description: "Appliquez sur une peau fraîchement hydratée ou superposez avec une lotion corporelle non parfumée pour fixer le parfum et prolonger sa tenue.",
          },
          {
            step: "04",
            title: "Vaporisez à Distance",
            description: "Tenez le flacon à 10–15 cm de votre peau et vaporisez en un mouvement balayant. Cela crée un brouillard uniforme qui se dépose naturellement.",
          },
        ],
      },
      whyUs: {
        eyebrow: "Pourquoi Venom",
        headline: "Créé selon une Norme Différente",
        items: [
          {
            title: "Sillage 12 Heures",
            description: "Notre concentration exclusive maintient votre parfum en vie du matin à minuit — sans retouches, sans estompage.",
          },
          {
            title: "Approuvé par les Dermatologues",
            description: "Chaque formule est testée pour la sécurité cutanée. Un parfum audacieux, sans compromis sur la santé de votre peau.",
          },
          {
            title: "Maîtres Parfumeurs",
            description: "Chaque senteur est développée avec des parfumeurs reconnus internationalement, forts de décennies d'expérience dans le parfum de luxe.",
          },
          {
            title: "Approvisionnement Éthique",
            description: "Nos matières premières sont sourcées durablement, sans tests sur les animaux et avec une transparence totale des ingrédients dans chaque flacon.",
          },
        ],
      },
    },
  },

  ar: {
    home: {
      hero: {
        headline: "أظهري سحرك",
        subtext: "عطور صُممت لتسرق الأنظار وتترك أثراً لا يُنسى.",
        ctaText: "تسوّقي الآن",
        socialProof: "4.5/5 من أكثر من 125,000 عميلة",
      },
      about: {
        headline: "عن فينوم",
        body: "في فينوم، نحن أكثر من مجرد علامة عطور — نحن حركة. وُلدنا من هوس بترك بصمة، وكل زجاجة نصنعها هي سلاح من أسلحة الأناقة. نؤمن بأن العطر هو أكثر إكسسواراتك خصوصية، ونحن هنا لنضمن أن عطرك يسرق الأنظار، ويُشعل المحادثات، ويبقى في الذاكرة طويلاً بعد مغادرتك.",
        ctaText: "تسوّقي الآن",
      },
      testimonials: {
        headlineBold: "النساء",
        headlineItalic: "يتحدثن",
        stats: [
          { percent: "93%", text: "من النساء تلقّين مزيداً من المجاملات بعد التحوّل إلى فينوم" },
          { percent: "88%", text: "أفدن بأن عطرهن يدوم أكثر من 8 ساعات على الجلد" },
          { percent: "97%", text: "قلن إنهن سيوصين بفينوم لصديقاتهن" },
        ],
      },
      benefits: {
        headlineBold: "اكتشفي سر",
        headlineItalic: "الأناقة الخالدة",
        items: [
          {
            title: "تركيبة طويلة الأمد",
            description: "ما يصل إلى 12 ساعة من الأثر العطري المكثف — من أول لقاء حتى آخر رقصة، عطرك لا يخفت أبداً.",
          },
          {
            title: "مكوّنات آمنة للبشرة",
            description: "مُصنَّع بمكوّنات معتمدة من الأطباء الجلديين. عطر جريء دون أي تنازل على صحة بشرتك.",
          },
          {
            title: "أثر عطري مميز",
            description: "مزيجنا الفريد يضمن أن تتركي أثراً — النوع الذي يتذكره الناس ويسألون عنه.",
          },
        ],
      },
      reviews: {
        headlineBold: "الدليل في كل",
        headlineItalic: "إطراء.",
        subtitle: "اسمعي من نساء رأين الشرارة، والنظرات، والكيمياء في العمل.",
        totalReviews: "3,091 تقييم",
      },
    },
    about: {
      hero: {
        eyebrow: "قصتنا",
        headline: "عطر يتحدث قبل أن تتحدثي",
        subtitle: "وُلد فينوم من قناعة واحدة راسخة — أن العطر الصحيح لا يُكمل شخصيتك فحسب، بل يُعلن عنها.",
      },
      stats: [
        { value: "125K+",   label: "عميلة سعيدة" },
        { value: "4.8★",    label: "متوسط التقييم" },
        { value: "12+",     label: "عطر توقيعي" },
        { value: "3 سنوات", label: "من الحرفية" },
      ],
      mission: {
        eyebrow: "لماذا نوجد",
        headlineBold: "لم نصنع عطراً.",
        headlineItalic: "صنعنا شعوراً.",
        body1: "معظم العطور مُصمَّمة لتكون ذات رائحة لطيفة. نحن صممنا عطرنا ليجعلك لا تُنسى. هناك فرق بين ارتداء عطر وامتلاك توقيع — وفينوم وُجد لمنح كل امرأة ذلك التوقيع.",
        body2: "هذا الهوس قادنا إلى ثلاث سنوات من البحث، وإعادة الصياغة، والاختبار المستمر. عملنا مع أساتذة العطور لابتكار روائح لا تجلس على بشرتك فحسب — بل تتحرك معك، وتتطور طوال اليوم، وتترك أثراً يدوم طويلاً بعد رحيلك.",
        ctaText: "استكشفي المجموعة",
      },
      values: {
        eyebrow: "ما نؤمن به",
        headlineBold: "مبنيّ على",
        headlineItalic: "مبادئ، لا صيحات",
        items: [
          {
            title: "الحرفية أولاً",
            description: "كل تركيبة تُصقل حتى تبلغ حد الإتقان. نحن لا نتسرع في السوق — ننتظر حتى يكون المنتج مثالياً.",
          },
          {
            title: "الشفافية التامة",
            description: "نخبرك بالضبط بما في كل زجاجة. لا مكوّنات مخفية، ولا ادعاءات مضللة.",
          },
          {
            title: "رؤية أنثوية",
            description: "صُنع بأيدي نساء، للنساء. كل قرار نتخذه يبدأ بالسؤال: هل هذا يخدمها؟",
          },
        ],
      },
      timeline: {
        eyebrow: "كيف وصلنا إلى هنا",
        headlineBold: "رحلة",
        headlineItalic: "فينوم",
        items: [
          {
            year: "2022",
            title: "بداية الهوس",
            text: "محادثة في منتصف الليل حول سبب عدم شعور أي عطر بالقوة الحقيقية أشعلت الفكرة التي ستصبح فينوم.",
          },
          {
            year: "2023",
            title: "ثلاث سنوات من الصنع",
            text: "تعاونّا مع أساتذة العطور وأمضينا أشهراً في اختبار أكثر من 60 تركيبة قبل أن نجد التركيبة المثالية.",
          },
          {
            year: "2024",
            title: "الإطلاق الأول",
            text: "أطلقنا فينوم بثلاثة عطور توقيعية. في غضون 72 ساعة، نفدت الدفعة الأولى بالكامل.",
          },
          {
            year: "2025",
            title: "حركة، لا مجرد علامة",
            text: "أكثر من 125,000 عميلة، و12 عطراً توقيعياً، ومجتمع من النساء اللواتي يرفضن المرور دون أن يُلاحَظن.",
          },
        ],
      },
      cta: {
        headline: "مستعدة لإظهار سحرك؟",
        subtitle: "اكتشفي المجموعة المُصمَّمة لتسرق الأنظار، وتُشعل الكيمياء، وتتركين بصمتك في كل مكان تدخلينه.",
        primaryCta: "تسوّقي المجموعة",
        secondaryCta: "العودة إلى الرئيسية",
      },
    },
    contact: {
      instagram: "@venomscents",
      tiktok: "@venomscents",
    },
    product: {
      howToUse: {
        eyebrow: "دليل الاستخدام",
        headline: "كيف تستفيدين أكثر من عطرك",
        steps: [
          {
            step: "01",
            title: "ضعيه على نقاط النبض",
            description: "رشّي على معصمك، رقبتك، خلف أذنيك وداخل كوعيك — هذه المناطق الدافئة تُضخّم عطرك وتشعّه طوال اليوم.",
          },
          {
            step: "02",
            title: "لا تفركي، اتركيه يتنفس",
            description: "بعد التطبيق، لا تفركي معصميك ببعضهما. الفرك يكسر النوتات الأولى ويُفقد العطر تطوره الطبيعي.",
          },
          {
            step: "03",
            title: "طبّقي طبقات للديمومة",
            description: "ضعي العطر على بشرة مرطّبة حديثاً أو بالتناوب مع لوشن غير معطّر لتثبيت الرائحة وإطالة ثباتها بشكل ملحوظ.",
          },
          {
            step: "04",
            title: "رشّي من مسافة",
            description: "أمسكي الزجاجة على بُعد 10–15 سم من بشرتك ورشّي بحركة انسيابية. هذا يُنشئ رذاذاً متساوياً يستقر بشكل طبيعي.",
          },
        ],
      },
      whyUs: {
        eyebrow: "لماذا فينوم",
        headline: "مُصنَّع وفق معيار مختلف",
        items: [
          {
            title: "أثر عطري لـ 12 ساعة",
            description: "تركيزنا الخاص يُبقي عطرك حياً من الصباح حتى منتصف الليل — دون لمسات إضافية، دون تلاشٍ.",
          },
          {
            title: "معتمد من الأطباء الجلديين",
            description: "كل تركيبة مُختبَرة للتأكد من سلامتها على البشرة. عطر جريء، دون أي تنازل على صحة بشرتك.",
          },
          {
            title: "أساتذة العطور",
            description: "كل رائحة تُطوَّر بالتعاون مع عطّارين معترف بهم دولياً، يمتلكون عقوداً من الخبرة في عالم العطور الفاخرة.",
          },
          {
            title: "مصادر أخلاقية",
            description: "مواد خاماتنا مُستمَدة باستدامة، دون اختبارات على الحيوانات، مع شفافية تامة في المكوّنات لكل زجاجة.",
          },
        ],
      },
    },
  },
};

async function seed() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL not set");

  const client = new MongoClient(uri);
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db();
  const result = await db.collection("Store").updateOne(
    { _id: new ObjectId(STORE_ID) },
    { $set: { content, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    console.error("Store not found:", STORE_ID);
  } else {
    console.log("Seeded content for store", STORE_ID);
    console.log("  Locales written: en, fr, ar");
    console.log("  Sections: home (hero, about, testimonials, benefits, reviews)");
    console.log("            about (hero, stats, mission, values, timeline, cta)");
    console.log("            contact");
  }

  await client.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
