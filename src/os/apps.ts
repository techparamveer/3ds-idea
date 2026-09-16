/** Curated from paramveer.co.uk and hackuk.network, 16 September 2026. */
export type Entry = { id: string; title: string; subtitle: string; pages: string[]; images?: string[]; url?: string; app?: string };
export type PortfolioApp = { id: string; title: string; subtitle: string; color: string; icon: string; entries: Entry[] };
const renu: Entry = {id:'renu',title:'Renu',subtitle:'NVIDIA hackathon · 2026',pages:['Built at the NVIDIA hackathon using Swift and DGX Spark.','The project write-up is still to come. See the original portfolio page for updates.'],images:['/portfolio/renu.jpg'],url:'https://www.paramveer.co.uk/projects/renu'};
const photography: Entry = {id:'buildings',title:'The Building Collection',subtitle:'Film photography · 2025',pages:['A photographic study of brutalist and modernist buildings: geometry, texture, light and repetition.','Shot on 35mm and medium-format film. The deliberate pace changes how I see. The first series was published and sold on Gumroad.'],images:[1,2,3].map(i=>`/portfolio/building${i}.jpg`),url:'https://pmvrsi.gumroad.com/'};
export const apps: PortfolioApp[] = [
 {id:'work',title:'Work',subtitle:'Experience & things I build',color:'#e58b32',icon:'case',entries:[
  {id:'alora',title:'Alora',subtitle:'CTO · 2026–present',pages:["We're still building. More about Alora is on the way."],url:'https://www.paramveer.co.uk/experience/alora'},
  {id:'microsoft',title:'Microsoft',subtitle:'Work experience · 2025',pages:['Microsoft Work Experience Program, March–April 2025.'],url:'https://www.paramveer.co.uk/experience/microsoft'},
  {id:'myucat',title:'MyUCAT',subtitle:'Software developer intern · 2024',pages:['Built exam-preparation features across question delivery and student analytics.','Added question types and progress-tracking dashboards, improving load times and reliability during peak season.'],url:'https://www.myucat.co.uk'},
  {id:'hackuk-work',title:'HackUK',subtitle:'Founder · 2025–present',pages:['Free hackathons and tech events for young people across the UK.'],app:'hackuk'}]},
 {id:'projects',title:'Side Projects',subtitle:'Ideas made into software',color:'#438fd7',icon:'code',entries:[
  {id:'ankicram',title:'AnkiCram',subtitle:'Anki add-on',pages:['An Anki add-on for focused exam cramming. A dedicated mode prioritises high-yield cards and surfaces weak areas.','Built after struggling with the volume of material for medical admissions tests. Shared across social media: 3k+ likes and 50k+ views.'],url:'https://ankicram.com'},
  {id:'cognilink',title:'CogniLink',subtitle:'Hack LDN · Knowunity track',pages:['An AI study companion that turns notes into active recall: spaced-repetition questions, explanations and quizzes.','Built in a 24-hour hackathon with Knowunity integration, reducing the friction between reading material and retaining it.'],url:'https://cognilink.vercel.app'},renu]},
 {id:'hobbies',title:'Hobbies',subtitle:'Through a different lens',color:'#9770cd',icon:'camera',entries:[photography]},
 {id:'life',title:'Life',subtitle:'Learning & community',color:'#62b49c',icon:'leaf',entries:[
  {id:'keele',title:'Keele University',subtitle:'Computer Science · 2025–present',pages:['BSc Computer Science (Hons), Keele University.']},
  {id:'hack-keele',title:'Hack Keele',subtitle:'Social Secretary · 2025–present',pages:['Social Secretary at Hack Keele, the university hackathon community.']},
  {id:'rws',title:'RWS Coding Club',subtitle:'President & Founder · 2024–2025',pages:['Founded and led the coding club at The Royal School, Wolverhampton.']},
  {id:'school',title:'The Royal School',subtitle:'Wolverhampton · 2023–2025',pages:['A-Levels at The Royal School, Wolverhampton.']}]},
 {id:'hackuk',title:'HackUK',subtitle:'Free events. Real things to build.',color:'#54badd',icon:'/portfolio/hackuk.png',entries:[
  {id:'mission',title:'Making tech accessible',subtitle:'Founder · HackUK',pages:['Free hackathons and tech events for 16–18-year-olds across the UK. No experience needed.','Workshops, build sessions and a community that helps young people take their first steps into technology.'],images:['/portfolio/hackuk-event.webp'],url:'https://www.hackuk.network/'},
  {id:'leafhacks',title:'LeafHacks 26',subtitle:'London · July 2026',pages:['100 participants came together in London Victoria for LeafHacks 26.'],url:'https://www.hackuk.network/'},
  {id:'campfire',title:'Campfire Birmingham',subtitle:'February 2026 · 23 builders',pages:['Hosted at Ormiston Sandwell Community Academy, bringing 23 young builders together.'],url:'https://www.hackuk.network/'},
  {id:'counterspell',title:'Counterspell',subtitle:'Wolverhampton · November 2024',pages:['40 participants at Wolverhampton Art Gallery.'],images:['/portfolio/hackuk-event.webp'],url:'https://www.hackuk.network/'}]},
 {id:'nvidia',title:'NVIDIA',subtitle:'Renu · Hackathon 2026',color:'#76b900',icon:'/portfolio/nvidia.png',entries:[renu]},
 {id:'about',title:'About',subtitle:'Paramveer Singh',color:'#e598ab',icon:'person',entries:[
  {id:'intro',title:'Paramveer Singh',subtitle:'Builder & student',pages:['I build tools that help people study, work and live. I like making things that feel useful, clear and personal.','My interests include study tools, knowledge systems and products that help people get unstuck.'],url:'https://www.paramveer.co.uk/about'},
  {id:'stack',title:'My toolkit',subtitle:'Software & product',pages:['Python, Swift and SwiftUI, React and Next.js, Supabase and Postgres, Java and Kotlin.']}]},
 {id:'contact',title:'Contact',subtitle:"Let's make something useful",color:'#6a9ec9',icon:'mail',entries:[
  {id:'email',title:'Send an email',subtitle:'hello@paramveer.co.uk',pages:['Get in touch about a project, collaboration or an idea.'],url:'mailto:hello@paramveer.co.uk'},
  {id:'book',title:'Book a conversation',subtitle:'cal.com/paramveersi',pages:['Choose a time for a conversation.'],url:'https://cal.com/paramveersi'},
  {id:'github',title:'GitHub',subtitle:'@techparamveer',pages:['Explore my code and projects.'],url:'https://github.com/techparamveer'},
  {id:'instagram',title:'Instagram',subtitle:'@techparamveer',pages:['Photography, projects and updates.'],url:'https://www.instagram.com/techparamveer/'},
  {id:'youtube',title:'YouTube',subtitle:'@techparamveer',pages:['Videos and things I am building.'],url:'https://www.youtube.com/@techparamveer'},
  {id:'twitter',title:'X / Twitter',subtitle:'@techparamveer',pages:['Ideas and updates.'],url:'https://x.com/techparamveer'},
  {id:'tiktok',title:'TikTok',subtitle:'@techparamveer',pages:['Projects and short videos.'],url:'https://www.tiktok.com/@techparamveer'}]},
];
export function getApp(id?:string|null){return apps.find(app=>app.id===id);}
