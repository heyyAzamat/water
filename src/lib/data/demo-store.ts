import type {
  Author,
  Comment,
  Notification,
  PollutionTag,
  Report,
  WaterBodyType,
  WaterLocation,
} from "@/types";
import { slugify } from "@/lib/utils";
import { syncFromBlob } from "./blob-store";

/**
 * The in-memory store used when no Supabase project is configured.
 *
 * It ships no sample reports: the platform starts empty and fills up only with
 * photos people actually analyse during the session. The Kazakhstan water-body
 * list below is reference data, used to attach an upload to a named place.
 *
 * When Supabase credentials are present this module is never used.
 */

const SEED_LOCATIONS: Array<{
  name: string;
  type: WaterBodyType;
  region: string;
  country: string;
  lat: number;
  lng: number;
  /** Baseline severity this water body tends to sit at. */
  baseline: number;
  /** Score-points per year the baseline drifts by. */
  drift: number;
  signature: PollutionTag[];
  description: string;
}> = [
  { name: "Есиль — набережная Астаны", type: "river", region: "Акмолинская", country: "Казахстан", lat: 51.1281, lng: 71.4304, baseline: 44, drift: -9, signature: ["turbidity", "floating_garbage"], description: "Городской участок в столице с высокой рекреационной нагрузкой." },
  { name: "Балхаш — Западный бассейн", type: "lake", region: "Карагандинская", country: "Казахстан", lat: 46.1667, lng: 74.8833, baseline: 52, drift: 7, signature: ["algae_bloom", "turbidity"], description: "Пресная западная часть бессточного озера, принимающая сток Или." },
  { name: "Большое Алматинское озеро", type: "reservoir", region: "Алматинская", country: "Казахстан", lat: 43.0533, lng: 76.9861, baseline: 11, drift: 1, signature: [], description: "Высокогорное моренное озеро, питающее водопровод Алматы." },
  { name: "Капшагайское водохранилище", type: "reservoir", region: "Алматинская", country: "Казахстан", lat: 43.8833, lng: 77.0667, baseline: 38, drift: -5, signature: ["floating_garbage", "plastic"], description: "Популярное летнее водохранилище на реке Или." },
  { name: "Сырдарья — Кызылорда", type: "river", region: "Кызылординская", country: "Казахстан", lat: 44.8479, lng: 65.4823, baseline: 66, drift: 4, signature: ["turbidity", "sewage"], description: "Нижнее течение, несущее коллекторно-дренажный сток полей." },

  /* ---------------------------------------------------------------- *
   * Kazakhstan — the network's home coverage.
   *
   * Grouped by basin so the map reads as a country, not a scatter: Caspian
   * and Aral, the Balkhash–Alakol system, the Irtysh in the east, the
   * northern lake belt, the industrial centre, Tobol, the west, the southern
   * Syr Darya corridor, and the Ili/Zhetysu rivers.
   * ---------------------------------------------------------------- */

  // Caspian and Aral
  { name: "Каспийское море — Актау", type: "sea", region: "Мангистауская", country: "Казахстан", lat: 43.635, lng: 51.158, baseline: 48, drift: 3, signature: ["oil_film", "industrial_discharge"], description: "Восточный берег Каспия у нефтяного порта Актау." },
  { name: "Каспийское море — Баутино", type: "sea", region: "Мангистауская", country: "Казахстан", lat: 44.535, lng: 50.25, baseline: 44, drift: 2, signature: ["oil_film"], description: "Залив Тюб-Караган, база каспийского флота и снабжения промыслов." },
  { name: "Каспийское море — устье Урала", type: "sea", region: "Атырауская", country: "Казахстан", lat: 46.85, lng: 51.65, baseline: 57, drift: 4, signature: ["turbidity", "oil_film", "industrial_discharge"], description: "Приустьевая зона, куда Урал выносит сток всего бассейна." },
  { name: "Северный Арал (Малый Арал)", type: "sea", region: "Кызылординская", country: "Казахстан", lat: 46.25, lng: 60.5, baseline: 62, drift: -12, signature: ["turbidity", "unnatural_color"], description: "Малое Аральское море, восстановленное Кокаральской плотиной." },
  { name: "Аральское море — Аральск", type: "sea", region: "Кызылординская", country: "Казахстан", lat: 46.79, lng: 61.66, baseline: 71, drift: -6, signature: ["turbidity", "unnatural_color"], description: "Бывший порт Аральск: береговая линия отступила на десятки километров." },
  { name: "Камыстыбас", type: "lake", region: "Кызылординская", country: "Казахстан", lat: 46.117, lng: 61.917, baseline: 52, drift: -3, signature: ["turbidity"], description: "Озеро Приаральской системы, восстановленное сбросами Сырдарьи." },

  // Balkhash and Alakol
  { name: "Балхаш — Восточный бассейн", type: "lake", region: "Жетысуская", country: "Казахстан", lat: 46.5, lng: 78.5, baseline: 58, drift: 8, signature: ["turbidity", "unnatural_color"], description: "Солёная восточная часть озера за проливом Узынарал." },
  { name: "Балхаш — залив Бертыс", type: "lake", region: "Карагандинская", country: "Казахстан", lat: 46.84, lng: 74.98, baseline: 64, drift: 5, signature: ["industrial_discharge", "turbidity"], description: "Залив у медеплавильного комбината города Балхаш." },
  { name: "Алаколь", type: "lake", region: "Жетысуская", country: "Казахстан", lat: 46.1, lng: 81.6, baseline: 22, drift: 3, signature: ["floating_garbage"], description: "Солоноватое озеро с галечными пляжами и растущей курортной нагрузкой." },
  { name: "Сасыкколь", type: "lake", region: "Жетысуская", country: "Казахстан", lat: 46.6, lng: 80.9, baseline: 27, drift: 2, signature: ["eutrophication"], description: "Пресноводное озеро Алакольской системы, ключевое для водоплавающих птиц." },
  { name: "Кошкарколь", type: "lake", region: "Жетысуская", country: "Казахстан", lat: 46.35, lng: 81.05, baseline: 25, drift: 1, signature: ["eutrophication"], description: "Мелководное озеро между Сасыкколем и Алаколем." },
  { name: "Жаланашколь", type: "lake", region: "Жетысуская", country: "Казахстан", lat: 45.55, lng: 82.05, baseline: 19, drift: 0, signature: [], description: "Небольшое озеро у Джунгарских ворот." },

  // Irtysh basin, east
  { name: "Зайсан", type: "lake", region: "Восточно-Казахстанская", country: "Казахстан", lat: 48.0, lng: 84.0, baseline: 35, drift: 4, signature: ["turbidity"], description: "Крупное пресное озеро, вошедшее в Бухтарминское водохранилище." },
  { name: "Маркаколь", type: "lake", region: "Восточно-Казахстанская", country: "Казахстан", lat: 48.75, lng: 85.75, baseline: 9, drift: 0, signature: [], description: "Высокогорное озеро в заповеднике, почти нетронутое." },
  { name: "Бухтарминское водохранилище", type: "reservoir", region: "Восточно-Казахстанская", country: "Казахстан", lat: 49.617, lng: 83.5, baseline: 31, drift: 2, signature: ["turbidity"], description: "Крупнейшее водохранилище страны, на Иртыше." },
  { name: "Шульбинское водохранилище", type: "reservoir", region: "Абайская", country: "Казахстан", lat: 50.4, lng: 81.45, baseline: 38, drift: 1, signature: ["turbidity"], description: "Водохранилище Шульбинской ГЭС на Иртыше." },
  { name: "Усть-Каменогорское водохранилище", type: "reservoir", region: "Восточно-Казахстанская", country: "Казахстан", lat: 49.9, lng: 82.4, baseline: 44, drift: -2, signature: ["industrial_discharge"], description: "Водохранилище в черте промышленного Усть-Каменогорска." },
  { name: "Иртыш — Усть-Каменогорск", type: "river", region: "Восточно-Казахстанская", country: "Казахстан", lat: 49.948, lng: 82.628, baseline: 52, drift: -3, signature: ["industrial_discharge", "turbidity"], description: "Участок ниже металлургического узла." },
  { name: "Иртыш — Семей", type: "river", region: "Абайская", country: "Казахстан", lat: 50.411, lng: 80.228, baseline: 43, drift: -4, signature: ["turbidity", "floating_garbage"], description: "Городской участок у исторического моста." },
  { name: "Иртыш — Павлодар", type: "river", region: "Павлодарская", country: "Казахстан", lat: 52.287, lng: 76.967, baseline: 49, drift: -2, signature: ["industrial_discharge", "oil_film"], description: "Участок ниже нефтехимического комплекса." },
  { name: "Ульба — Усть-Каменогорск", type: "river", region: "Восточно-Казахстанская", country: "Казахстан", lat: 49.967, lng: 82.617, baseline: 58, drift: -5, signature: ["industrial_discharge", "unnatural_color"], description: "Приток Иртыша, исторически принимавший стоки обогатительных фабрик." },
  { name: "Уба — Шемонаиха", type: "river", region: "Восточно-Казахстанская", country: "Казахстан", lat: 50.633, lng: 81.917, baseline: 26, drift: -1, signature: [], description: "Горная река Рудного Алтая." },
  { name: "Бухтарма", type: "river", region: "Восточно-Казахстанская", country: "Казахстан", lat: 49.65, lng: 84.3, baseline: 17, drift: 0, signature: [], description: "Правый приток Иртыша, берущий начало в Южном Алтае." },

  // Northern lake belt
  { name: "Есиль — Петропавловск", type: "river", region: "Северо-Казахстанская", country: "Казахстан", lat: 54.867, lng: 69.15, baseline: 47, drift: -3, signature: ["turbidity", "sewage"], description: "Городской участок перед выходом реки в Россию." },
  { name: "Сергеевское водохранилище", type: "reservoir", region: "Северо-Казахстанская", country: "Казахстан", lat: 53.883, lng: 67.417, baseline: 33, drift: 1, signature: ["eutrophication"], description: "Основной источник питьевой воды Северного Казахстана." },
  { name: "Вячеславское водохранилище", type: "reservoir", region: "Акмолинская", country: "Казахстан", lat: 51.28, lng: 70.98, baseline: 29, drift: 2, signature: ["eutrophication"], description: "Питьевое водохранилище столицы на Есиле." },
  { name: "Тенгиз", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 50.417, lng: 68.917, baseline: 24, drift: 3, signature: ["unnatural_color"], description: "Солёное бессточное озеро Коргалжынского заповедника." },
  { name: "Султанкелди (Коргалжын)", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 50.47, lng: 69.22, baseline: 21, drift: 1, signature: ["eutrophication"], description: "Пресное озеро системы, северная граница гнездования фламинго." },
  { name: "Боровое (Бурабай)", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 53.083, lng: 70.3, baseline: 26, drift: 4, signature: ["floating_garbage", "eutrophication"], description: "Курортное озеро с высокой рекреационной нагрузкой." },
  { name: "Щучье", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 52.933, lng: 70.2, baseline: 23, drift: 3, signature: ["eutrophication"], description: "Глубокое озеро Бурабайского национального парка." },
  { name: "Большое Чебачье", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 53.117, lng: 70.15, baseline: 18, drift: 1, signature: [], description: "Самое прозрачное озеро Бурабая." },
  { name: "Селетытениз", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 53.25, lng: 73.3, baseline: 34, drift: 5, signature: ["unnatural_color"], description: "Солёное бессточное озеро на севере страны." },
  { name: "Кобейтуз", type: "lake", region: "Акмолинская", country: "Казахстан", lat: 51.85, lng: 72.55, baseline: 20, drift: 2, signature: ["unnatural_color", "floating_garbage"], description: "Розовое солёное озеро, ставшее точкой притяжения туристов." },
  { name: "Улькен Карой", type: "lake", region: "Северо-Казахстанская", country: "Казахстан", lat: 53.55, lng: 71.05, baseline: 30, drift: 2, signature: [], description: "Солёное озеро Северо-Казахстанской равнины." },
  { name: "Теке", type: "lake", region: "Северо-Казахстанская", country: "Казахстан", lat: 53.8, lng: 69.9, baseline: 28, drift: 1, signature: [], description: "Горько-солёное озеро у российской границы." },
  { name: "Кушмурун", type: "lake", region: "Костанайская", country: "Казахстан", lat: 52.45, lng: 64.6, baseline: 33, drift: 2, signature: ["unnatural_color"], description: "Солоноватое озеро в Тургайской ложбине." },

  // Bayanaul and the Irtysh–Karaganda transfer
  { name: "Жасыбай", type: "lake", region: "Павлодарская", country: "Казахстан", lat: 50.783, lng: 75.65, baseline: 22, drift: 3, signature: ["floating_garbage"], description: "Озеро Баянаульского нацпарка, летом переполнено отдыхающими." },
  { name: "Сабындыколь", type: "lake", region: "Павлодарская", country: "Казахстан", lat: 50.8, lng: 75.717, baseline: 24, drift: 2, signature: ["eutrophication"], description: "Крупнейшее озеро Баянаула." },
  { name: "Торайгыр", type: "lake", region: "Павлодарская", country: "Казахстан", lat: 50.75, lng: 75.5, baseline: 19, drift: 1, signature: [], description: "Малое озеро в гранитных сопках Баянаула." },
  { name: "Канал Иртыш — Караганда", type: "canal", region: "Карагандинская", country: "Казахстан", lat: 50.5, lng: 74.5, baseline: 41, drift: 0, signature: ["turbidity"], description: "Канал имени Сатпаева, перебрасывающий иртышскую воду в Центральный Казахстан." },
  { name: "Шидерты", type: "river", region: "Павлодарская", country: "Казахстан", lat: 51.65, lng: 74.5, baseline: 37, drift: 1, signature: ["turbidity"], description: "Река, зарегулированная каналом Иртыш — Караганда." },

  // Industrial centre
  { name: "Нура — Темиртау", type: "river", region: "Карагандинская", country: "Казахстан", lat: 50.05, lng: 72.95, baseline: 68, drift: -7, signature: ["industrial_discharge", "unnatural_color", "turbidity"], description: "Участок ниже металлургического комбината с историческим ртутным загрязнением." },
  { name: "Нура — Коргалжын", type: "river", region: "Акмолинская", country: "Казахстан", lat: 50.58, lng: 70.1, baseline: 44, drift: -5, signature: ["turbidity"], description: "Нижнее течение перед впадением в Тенгиз." },
  { name: "Самаркандское водохранилище", type: "reservoir", region: "Карагандинская", country: "Казахстан", lat: 50.067, lng: 72.95, baseline: 59, drift: -4, signature: ["industrial_discharge"], description: "Водохранилище Темиртау на Нуре." },
  { name: "Шерубайнуринское водохранилище", type: "reservoir", region: "Карагандинская", country: "Казахстан", lat: 49.7, lng: 72.8, baseline: 42, drift: -1, signature: ["turbidity"], description: "Источник водоснабжения Караганды." },
  { name: "Интумак", type: "reservoir", region: "Карагандинская", country: "Казахстан", lat: 49.55, lng: 72.05, baseline: 39, drift: 0, signature: ["turbidity"], description: "Водохранилище на Нуре выше Караганды." },
  { name: "Кенгирское водохранилище", type: "reservoir", region: "Улытауская", country: "Казахстан", lat: 47.8, lng: 67.65, baseline: 46, drift: 2, signature: ["industrial_discharge"], description: "Водохранилище Жезказганского горно-металлургического узла." },
  { name: "Сарысу — Жезказган", type: "river", region: "Улытауская", country: "Казахстан", lat: 47.783, lng: 67.7, baseline: 51, drift: 3, signature: ["turbidity", "industrial_discharge"], description: "Степная река, теряющаяся в песках Приаралья." },

  // Tobol basin
  { name: "Тобол — Костанай", type: "river", region: "Костанайская", country: "Казахстан", lat: 53.217, lng: 63.617, baseline: 45, drift: -2, signature: ["turbidity", "sewage"], description: "Городской участок Тобола." },
  { name: "Тобол — Рудный", type: "river", region: "Костанайская", country: "Казахстан", lat: 52.967, lng: 63.117, baseline: 55, drift: -3, signature: ["industrial_discharge", "turbidity"], description: "Участок ниже железорудного карьера." },
  { name: "Каратомарское водохранилище", type: "reservoir", region: "Костанайская", country: "Казахстан", lat: 52.9, lng: 62.95, baseline: 40, drift: -1, signature: ["turbidity"], description: "Водохранилище на Тоболе для водоснабжения Рудного." },
  { name: "Верхнетобольское водохранилище", type: "reservoir", region: "Костанайская", country: "Казахстан", lat: 52.4, lng: 61.9, baseline: 36, drift: 0, signature: [], description: "Верхний накопитель тобольского каскада." },
  { name: "Тургай", type: "river", region: "Костанайская", country: "Казахстан", lat: 49.633, lng: 63.5, baseline: 36, drift: 1, signature: ["turbidity"], description: "Река, теряющаяся в бессточных озёрах Тургайской ложбины." },

  // West
  { name: "Актюбинское водохранилище", type: "reservoir", region: "Актюбинская", country: "Казахстан", lat: 50.283, lng: 57.25, baseline: 43, drift: -2, signature: ["eutrophication", "turbidity"], description: "Водохранилище на Илеке, питьевой источник Актобе." },
  { name: "Илек — Актобе", type: "river", region: "Актюбинская", country: "Казахстан", lat: 50.28, lng: 57.17, baseline: 61, drift: -4, signature: ["industrial_discharge", "unnatural_color"], description: "Река с историческим борным и хромовым загрязнением." },
  { name: "Иргиз", type: "river", region: "Актюбинская", country: "Казахстан", lat: 48.617, lng: 61.267, baseline: 39, drift: 1, signature: ["turbidity"], description: "Степная река бассейна Тургая." },
  { name: "Жайык (Урал) — Уральск", type: "river", region: "Западно-Казахстанская", country: "Казахстан", lat: 51.233, lng: 51.367, baseline: 42, drift: 1, signature: ["turbidity", "floating_garbage"], description: "Городской участок трансграничной реки." },
  { name: "Жайык (Урал) — Атырау", type: "river", region: "Атырауская", country: "Казахстан", lat: 47.117, lng: 51.883, baseline: 54, drift: 3, signature: ["oil_film", "turbidity"], description: "Нижнее течение в нефтяной столице страны." },
  { name: "Шалкар", type: "lake", region: "Западно-Казахстанская", country: "Казахстан", lat: 50.533, lng: 51.667, baseline: 29, drift: 2, signature: [], description: "Солоноватое озеро Прикаспийской низменности." },
  { name: "Жем (Эмба) — Кульсары", type: "river", region: "Атырауская", country: "Казахстан", lat: 46.95, lng: 54.017, baseline: 58, drift: 2, signature: ["oil_film", "industrial_discharge"], description: "Река в старейшем нефтедобывающем районе." },

  // Syr Darya corridor and the south
  { name: "Сырдарья — Казалинск", type: "river", region: "Кызылординская", country: "Казахстан", lat: 45.767, lng: 62.1, baseline: 69, drift: 2, signature: ["turbidity", "sewage"], description: "Нижнее течение перед дельтой в Малом Арале." },
  { name: "Сырдарья — Шардара", type: "river", region: "Туркестанская", country: "Казахстан", lat: 41.25, lng: 68.0, baseline: 63, drift: 3, signature: ["turbidity", "industrial_discharge"], description: "Участок ниже Шардаринского водохранилища." },
  { name: "Шардаринское водохранилище", type: "reservoir", region: "Туркестанская", country: "Казахстан", lat: 41.2, lng: 68.05, baseline: 57, drift: 4, signature: ["turbidity", "eutrophication"], description: "Крупнейшее водохранилище юга, на Сырдарье." },
  { name: "Бугуньское водохранилище", type: "reservoir", region: "Туркестанская", country: "Казахстан", lat: 42.9, lng: 68.6, baseline: 45, drift: 2, signature: ["eutrophication"], description: "Ирригационное водохранилище на реке Бугунь." },
  { name: "Арыс — Шымкент", type: "river", region: "Туркестанская", country: "Казахстан", lat: 42.433, lng: 68.8, baseline: 56, drift: 1, signature: ["sewage", "turbidity"], description: "Приток Сырдарьи, принимающий сток агломерации." },
  { name: "Бадам — Шымкент", type: "river", region: "Туркестанская", country: "Казахстан", lat: 42.3, lng: 69.6, baseline: 64, drift: -3, signature: ["sewage", "industrial_discharge"], description: "Городская река Шымкента ниже промзоны." },
  { name: "Келес", type: "river", region: "Туркестанская", country: "Казахстан", lat: 41.45, lng: 69.2, baseline: 49, drift: 2, signature: ["turbidity", "sewage"], description: "Пограничная река на юге страны." },
  { name: "Билликоль", type: "lake", region: "Жамбылская", country: "Казахстан", lat: 43.1, lng: 70.5, baseline: 41, drift: 3, signature: ["eutrophication", "unnatural_color"], description: "Бессточное озеро, принимающее коллекторный сток." },
  { name: "Талас — Тараз", type: "river", region: "Жамбылская", country: "Казахстан", lat: 42.9, lng: 71.367, baseline: 53, drift: 2, signature: ["industrial_discharge", "turbidity"], description: "Река ниже фосфорного узла Тараза." },
  { name: "Шу — Шу", type: "river", region: "Жамбылская", country: "Казахстан", lat: 43.6, lng: 73.75, baseline: 47, drift: 1, signature: ["turbidity"], description: "Трансграничная река, уходящая в пески Мойынкум." },
  { name: "Тасөткельское водохранилище", type: "reservoir", region: "Жамбылская", country: "Казахстан", lat: 43.9, lng: 73.0, baseline: 40, drift: 1, signature: ["turbidity"], description: "Ирригационное водохранилище на Шу." },

  // Ili basin and Zhetysu
  { name: "Или — Баканас", type: "river", region: "Алматинская", country: "Казахстан", lat: 44.8, lng: 76.267, baseline: 44, drift: 3, signature: ["turbidity"], description: "Среднее течение Или в пустыне Сарыесик-Атырау." },
  { name: "Дельта Или", type: "wetland", region: "Алматинская", country: "Казахстан", lat: 45.35, lng: 74.6, baseline: 39, drift: 4, signature: ["turbidity", "eutrophication"], description: "Тростниковая дельта, определяющая рыбный запас Балхаша." },
  { name: "Чарын", type: "river", region: "Алматинская", country: "Казахстан", lat: 43.35, lng: 79.067, baseline: 15, drift: 0, signature: [], description: "Горная река в одноимённом каньоне." },
  { name: "Каратал — Талдыкорган", type: "river", region: "Жетысуская", country: "Казахстан", lat: 45.017, lng: 78.367, baseline: 38, drift: 1, signature: ["turbidity"], description: "Река, впадающая в Балхаш с юга." },
  { name: "Аксу — Сарканд", type: "river", region: "Жетысуская", country: "Казахстан", lat: 45.41, lng: 79.92, baseline: 24, drift: 0, signature: [], description: "Горная река Джунгарского Алатау." },
  { name: "Лепсы", type: "river", region: "Жетысуская", country: "Казахстан", lat: 46.0, lng: 80.7, baseline: 22, drift: 0, signature: [], description: "Река, впадающая в Балхаш из Джунгарии." },
  { name: "Коксу", type: "river", region: "Жетысуская", country: "Казахстан", lat: 44.9, lng: 78.9, baseline: 20, drift: 0, signature: [], description: "Приток Каратала в предгорьях Джунгарского Алатау." },
  { name: "Каинды", type: "lake", region: "Алматинская", country: "Казахстан", lat: 42.983, lng: 78.467, baseline: 8, drift: 0, signature: [], description: "Затопленный еловый лес на высоте двух тысяч метров." },
  { name: "Кольсай — Нижнее озеро", type: "lake", region: "Алматинская", country: "Казахстан", lat: 42.933, lng: 78.333, baseline: 12, drift: 2, signature: ["floating_garbage"], description: "Первое из каскада Кольсайских озёр, растущая туристическая нагрузка." },
  { name: "Кольсай — Среднее озеро", type: "lake", region: "Алматинская", country: "Казахстан", lat: 42.883, lng: 78.333, baseline: 7, drift: 0, signature: [], description: "Второе озеро каскада, доступное только пешком." },
  { name: "Есик", type: "lake", region: "Алматинская", country: "Казахстан", lat: 43.25, lng: 77.47, baseline: 16, drift: 1, signature: ["turbidity"], description: "Горное озеро, восстановленное после селя 1963 года." },
  { name: "Тузколь", type: "lake", region: "Алматинская", country: "Казахстан", lat: 42.9, lng: 80.2, baseline: 17, drift: 1, signature: ["unnatural_color"], description: "Солёное озеро у подножия Хан-Тенгри." },
  { name: "Сорбулак", type: "lake", region: "Алматинская", country: "Казахстан", lat: 43.8, lng: 76.6, baseline: 79, drift: -2, signature: ["sewage", "eutrophication", "unnatural_color"], description: "Накопитель сточных вод Алматинской агломерации." },
  { name: "Бартогайское водохранилище", type: "reservoir", region: "Алматинская", country: "Казахстан", lat: 43.367, lng: 78.317, baseline: 21, drift: 1, signature: [], description: "Водохранилище на Чилике, питающее Большой Алматинский канал." },
  { name: "Куртинское водохранилище", type: "reservoir", region: "Алматинская", country: "Казахстан", lat: 44.1, lng: 75.9, baseline: 33, drift: 2, signature: ["turbidity"], description: "Водохранилище на Курты в Балхашском бассейне." },
  { name: "Большой Алматинский канал", type: "canal", region: "Алматинская", country: "Казахстан", lat: 43.2, lng: 76.7, baseline: 35, drift: 0, signature: ["floating_garbage"], description: "Магистральный ирригационный канал вдоль подгорной равнины." },
  { name: "Большая Алматинка", type: "river", region: "Алматы", country: "Казахстан", lat: 43.233, lng: 76.883, baseline: 49, drift: -2, signature: ["floating_garbage", "plastic"], description: "Горная река в черте города, зарегулированная селезащитой." },
  { name: "Малая Алматинка", type: "river", region: "Алматы", country: "Казахстан", lat: 43.25, lng: 76.95, baseline: 54, drift: -3, signature: ["floating_garbage", "plastic", "sewage"], description: "Городской водоток через центр Алматы." },
  { name: "Каскелен", type: "river", region: "Алматинская", country: "Казахстан", lat: 43.2, lng: 76.617, baseline: 43, drift: -1, signature: ["floating_garbage"], description: "Река западной части Алматинской агломерации." },
  { name: "Тургень", type: "river", region: "Алматинская", country: "Казахстан", lat: 43.383, lng: 77.6, baseline: 18, drift: 0, signature: [], description: "Горная река с водопадами в национальном парке." },
];

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

export interface DemoDataset {
  locations: WaterLocation[];
  authors: Author[];
  reports: Report[];
  comments: Comment[];
  notifications: Notification[];
}

/**
 * Starts empty: no sample reports, photos, authors or notifications. Only the
 * reference list of Kazakhstan water bodies is kept so uploads can be matched
 * to a named place. Everything else appears as people analyse real photos.
 */
function build(): DemoDataset {
  const locations: WaterLocation[] = SEED_LOCATIONS.map((loc, i) => ({
    id: `loc-${String(i + 1).padStart(3, "0")}`,
    name: loc.name,
    slug: slugify(loc.name),
    type: loc.type,
    region: loc.region,
    country: loc.country,
    lat: loc.lat,
    lng: loc.lng,
    description: loc.description,
  }));

  return { locations, authors: [], reports: [], comments: [], notifications: [] };
}

/**
 * Built once per process. Mutable so uploads made during a demo session show
 * up in the dashboard, map and leaderboard exactly as they would with a real
 * database behind them.
 *
 * Parked on `globalThis` rather than in a module-level binding: Next bundles
 * route handlers and page renders into separate server chunks, so a plain
 * module variable gives each of them its own copy — a report written by
 * `POST /api/reports` would then 404 on the page it redirects to. The same
 * indirection survives dev hot-reloads, which would otherwise reset the
 * dataset on every edit.
 */
const DATASET_KEY = Symbol.for("aquavision.demo-dataset");

type DatasetHolder = { [DATASET_KEY]?: DemoDataset };

export function demoData(): DemoDataset {
  const holder = globalThis as unknown as DatasetHolder;
  if (!holder[DATASET_KEY]) holder[DATASET_KEY] = build();
  return holder[DATASET_KEY];
}

/** The dataset, refreshed from durable storage (Vercel Blob) when enabled. */
export async function loadDemo(): Promise<DemoDataset> {
  const data = demoData();
  await syncFromBlob(data);
  return data;
}

export function addDemoReport(report: Report) {
  const data = demoData();
  data.reports.unshift(report);
  if (report.location && !data.locations.some((l) => l.id === report.location!.id)) {
    data.locations.push(report.location);
  }
  const author = data.authors.find((a) => a.id === report.author.id);
  if (author) {
    author.points += 10 + Math.floor(report.analysis.pollutionScore / 10) * 3;
  }
  return report;
}

export function addDemoComment(comment: Comment, reportId: string) {
  const data = demoData();
  data.comments.push(comment);
  const report = data.reports.find((r) => r.id === reportId);
  if (report) report.commentCount += 1;
  return comment;
}

export function removeDemoReport(id: string) {
  const data = demoData();
  const index = data.reports.findIndex((r) => r.id === id);
  if (index === -1) return false;
  data.reports.splice(index, 1);
  return true;
}
