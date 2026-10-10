/**
 * Static landing page content.
 *
 * The landing page is a pure static view and never reads from the backend.
 * Replace the placeholder branding and copy below with the school's real
 * identity when it is available — this file is the single source of truth.
 */

export const brand = {
  name: 'أكاديمية النخبة',
  tagline: 'للتعليم الأساسي',
}

export const nav = [
  { label: 'الرئيسية', href: '#home' },
  { label: 'عن المدرسة', href: '#about' },
  { label: 'البرامج', href: '#programs' },
  { label: 'الكادر', href: '#faculty' },
  { label: 'تواصل معنا', href: '#contact' },
]

export const hero = {
  eyebrow: 'التسجيل مفتوح للعام الدراسي 2026 / 2027',
  title: 'نُهيّئ أبناءك لبناء مستقبل واثق',
  subtitle:
    'مدرسة أساسية تجمع بين تعليم متين ورعاية تربوية، من الصف الأول حتى السادس، بإشراف كادر تعليمي متخصص.',
  primaryCta: { label: 'سجّل الآن', href: '#contact' },
  secondaryCta: { label: 'استكشف البرامج', href: '#programs' },
}

export const stats = [
  { value: '6', label: 'المراحل الدراسية' },
  { value: '1200+', label: 'طالب وطالبة' },
  { value: '85', label: 'معلمًا ومعلمة' },
  { value: '20', label: 'سنة من الخبرة' },
]

export const features = [
  {
    icon: 'staff',
    title: 'كادر تعليمي متخصص',
    description: 'معلمون مؤهلون يتابعون كل طالب على حدة ويصمّمون الدعم حسب مستواه.',
  },
  {
    icon: 'book',
    title: 'مناهج متوازنة',
    description: 'برنامج يجمع بين المواد الأساسية والمهارات الحديثة والأنشطة اللامنهجية.',
  },
  {
    icon: 'shield',
    title: 'بيئة آمنة ومحفّزة',
    description: 'فصول مجهّزة ومساحات آمنة تشجّع الطالب على المشاركة والاكتشاف.',
  },
  {
    icon: 'chart',
    title: 'متابعة أولياء الأمور',
    description: 'تقارير دورية وقنوات تواصل واضحة لمتابعة تقدّم الطالب خطوة بخطوة.',
  },
]

export const levels = [
  { number: '1', name: 'الصف الأول', description: 'تأسيس مهارات القراءة والكتابة والحساب.' },
  { number: '2', name: 'الصف الثاني', description: 'تعزيز مهارات القراءة والفهم والحساب.' },
  { number: '3', name: 'الصف الثالث', description: 'بناء التفكير المنطقي ومهارات البحث.' },
  { number: '4', name: 'الصف الرابع', description: 'توسيع المعرفة في المواد الأساسية.' },
  { number: '5', name: 'الصف الخامس', description: 'تنمية الاستقلالية ومهارات الدراسة.' },
  { number: '6', name: 'الصف السادس', description: 'التحضير للانتقال إلى المرحلة التالية.' },
]

export const courses = [
  { name: 'اللغة العربية', description: 'قراءة وكتابة وتعبير.' },
  { name: 'الرياضيات', description: 'الحساب والتفكير المنطقي.' },
  { name: 'العلوم', description: 'استكشاف الطبيعة بالتجريب.' },
  { name: 'اللغة الإنجليزية', description: 'مهارات الاستماع والتحدّث.' },
  { name: 'التربية الإسلامية', description: 'القيم والسلوك.' },
  { name: 'الحاسوب', description: 'أساسيات التقنية والبرمجة.' },
]

export const faculty = [
  { name: 'أ. سارة العلي', subject: 'اللغة العربية' },
  { name: 'أ. محمد الحسن', subject: 'الرياضيات' },
  { name: 'أ. ليلى منصور', subject: 'العلوم' },
  { name: 'أ. خالد يوسف', subject: 'اللغة الإنجليزية' },
]

export const cta = {
  title: 'باب التسجيل مفتوح',
  description: 'احجز مقعد ابنك اليوم، وفريقنا جاهز للإجابة عن كل استفساراتك.',
  button: { label: 'تواصل معنا', href: '#contact' },
}

export const footer = {
  about:
    'مدرسة أساسية تقدّم تعليمًا متوازنًا يجمع بين التحصيل الأكاديمي والتربية على القيم.',
  contact: {
    title: 'تواصل معنا',
    address: 'شارع التعليم، المدينة',
    phone: '+000 000 0000',
    email: 'info@example.com',
  },
  links: {
    title: 'روابط سريعة',
    items: [
      { label: 'عن المدرسة', href: '#about' },
      { label: 'البرامج', href: '#programs' },
      { label: 'الكادر', href: '#faculty' },
      { label: 'تسجيل الدخول', href: '/login' },
    ],
  },
  hours: {
    title: 'أوقات الدوام',
    value: 'الأحد – الخميس: 8:00 ص – 3:00 م',
  },
}
