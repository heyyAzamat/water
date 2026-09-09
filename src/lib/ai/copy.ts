/**
 * Localised prose for the heuristic engine.
 *
 * The vision model is told which language to answer in (see `prompt.ts`), but
 * the heuristic fallback composes its sentences in code — so it needs its own
 * translations, otherwise a Russian reporter gets an English assessment
 * whenever no vision key is configured.
 *
 * These strings become part of the stored report, exactly like the model's own
 * output: a report written in Russian stays Russian for every later reader.
 * Kept out of the UI dictionaries deliberately — this copy is only ever built
 * server-side and never needs to cross to the client.
 */

import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export interface AnalysisCopy {
  notes: {
    clarityLow: string;
    clarityOk: string;
    sediment: string;
    algae: string;
    eutrophication: string;
    foam: string;
    oil: string;
    unnaturalColour: string;
    litter: string;
    plastic: string;
    observationOnly: string;
    corroborated: string;
  };
  objects: {
    sediment: string;
    algalMats: string;
    foam: string;
    oilSheen: string;
    plume: string;
    debris: string;
    plastic: string;
    openWater: string;
  };
  scene: {
    light: { bright: string; dim: string; even: string };
    tone: { green: string; brown: string; neutral: string };
    summary: string;
    fallback: string;
  };
  explain: {
    drivers: string;
    driverItem: string;
    noDrivers: string;
    clarityPoor: string;
    clarityOk: string;
    composite: string;
    fieldNote: string;
    fallback: string;
  };
  recommendations: {
    litter: string;
    oil: string;
    algae: string;
    sewage: string;
    deadFish: string;
    industrial: string;
    critical: string;
    poor: string;
    moderate: string;
    healthy: string;
    moreAngles: string;
  };
}

const en: AnalysisCopy = {
  notes: {
    clarityLow:
      "Low transparency: contrast {contrast}% with a strong sediment cast.",
    clarityOk:
      "Water column reads as reasonably transparent (contrast {contrast}%).",
    sediment: "Warm muddy tint across {pct}% of the frame.",
    algae:
      "Green channel leads red/blue by {pct}% — consistent with algal biomass.",
    eutrophication: "Dense surface vegetation suggests elevated nutrient load.",
    foam: "Bright desaturated texture over {pct}% of the surface.",
    oil: "Iridescent hue spread ({pct}%) inside dark surface regions.",
    unnaturalColour:
      "{pct}% of pixels fall in hue ranges rare in natural water.",
    litter:
      "Fragmented high-contrast edges across the surface (edge density {pct}%).",
    plastic:
      "Bright, saturated, geometrically irregular fragments typical of packaging waste.",
    observationOnly:
      "Reported by the observer on site; not independently visible in this frame.",
    corroborated: "Corroborated by reporter observation.",
  },
  objects: {
    sediment: "Sediment-laden water",
    algalMats: "Green algal mats",
    foam: "Surface foam",
    oilSheen: "Oil sheen",
    plume: "Discoloured plume",
    debris: "Floating debris",
    plastic: "Plastic fragments",
    openWater: "Open water surface",
  },
  scene: {
    light: { bright: "brightly lit", dim: "dim", even: "evenly lit" },
    tone: {
      green: "green-tinted",
      brown: "brown-tinted",
      neutral: "neutral-toned",
    },
    summary: "A {light}, {tone} water surface with composite severity {score}/100.",
    fallback: "Water body surface photograph.",
  },
  explain: {
    drivers: "Colourimetric analysis of this frame flags {list}.",
    driverItem: "{label} ({severity}/100)",
    noDrivers:
      "No significant anthropogenic pollution signature was measurable in this frame.",
    clarityPoor:
      "Water transparency is poor — luminance contrast sits at {pct}% with a heavy sediment cast.",
    clarityOk:
      "Water transparency is acceptable, with luminance contrast at {pct}%.",
    composite:
      "The weighted indicator matrix yields a composite environmental severity of {score}/100.",
    fieldNote:
      "The reporter's field note has been recorded alongside this assessment but was not used to raise the visual score beyond corroboration.",
    fallback:
      "Composite severity {score}/100 ({quality}). Derived from {count} visual indicators.",
  },
  recommendations: {
    litter:
      "Organise a shoreline cleanup and install a floating debris boom at the nearest inflow.",
    oil: "Report a suspected hydrocarbon spill to the regional environmental inspectorate within 24 hours.",
    algae:
      "Trace upstream nutrient sources — agricultural runoff and untreated greywater are the usual drivers.",
    sewage:
      "Sample for surfactants and coliform bacteria; check nearby outfalls for illegal connections.",
    deadFish:
      "Escalate immediately: a fish kill indicates acute toxicity or oxygen collapse.",
    industrial:
      "Document the outfall location and request the operator's discharge permit from the regulator.",
    critical:
      "Restrict public contact with the water until laboratory testing is complete.",
    poor: "Schedule follow-up photography every 7 days to track progression.",
    moderate: "Add this location to the monthly monitoring rotation.",
    healthy:
      "Condition is healthy — re-photograph seasonally to establish a baseline.",
    moreAngles:
      "Upload additional angles (shoreline, inflow, outflow) to raise analysis confidence.",
  },
};

const ru: AnalysisCopy = {
  notes: {
    clarityLow:
      "Низкая прозрачность: контраст {contrast}% с выраженным осадочным налётом.",
    clarityOk:
      "Водная толща достаточно прозрачна (контраст {contrast}%).",
    sediment: "Тёплый мутный оттенок на {pct}% кадра.",
    algae:
      "Зелёный канал превышает красный и синий на {pct}% — характерно для водорослевой биомассы.",
    eutrophication:
      "Плотная растительность на поверхности указывает на повышенную нагрузку биогенами.",
    foam: "Яркая обесцвеченная текстура на {pct}% поверхности.",
    oil: "Радужный разброс оттенков ({pct}%) в тёмных участках поверхности.",
    unnaturalColour:
      "{pct}% пикселей попадают в диапазоны оттенков, редкие для природной воды.",
    litter:
      "Фрагментированные контрастные границы по поверхности (плотность границ {pct}%).",
    plastic:
      "Яркие насыщенные фрагменты неправильной геометрии — типично для упаковочных отходов.",
    observationOnly:
      "Отмечено наблюдателем на месте; на этом кадре независимо не подтверждается.",
    corroborated: "Подтверждено наблюдением автора отчёта.",
  },
  objects: {
    sediment: "Вода со взвесью",
    algalMats: "Зелёные водорослевые маты",
    foam: "Пена на поверхности",
    oilSheen: "Нефтяная плёнка",
    plume: "Обесцвеченный шлейф",
    debris: "Плавающий мусор",
    plastic: "Фрагменты пластика",
    openWater: "Открытая водная поверхность",
  },
  scene: {
    light: {
      bright: "ярко освещённая",
      dim: "слабо освещённая",
      even: "равномерно освещённая",
    },
    tone: {
      green: "с зеленоватым оттенком",
      brown: "с бурым оттенком",
      neutral: "нейтрального тона",
    },
    summary:
      "{light}, {tone} водная поверхность с итоговой тяжестью {score}/100.",
    fallback: "Фотография поверхности водоёма.",
  },
  explain: {
    drivers: "Колориметрический анализ кадра выявил: {list}.",
    driverItem: "{label} ({severity}/100)",
    noDrivers:
      "Значимых признаков антропогенного загрязнения на этом кадре измерить не удалось.",
    clarityPoor:
      "Прозрачность воды низкая — контраст яркости составляет {pct}% при выраженном осадочном налёте.",
    clarityOk:
      "Прозрачность воды приемлемая, контраст яркости {pct}%.",
    composite:
      "Взвешенная матрица индикаторов даёт итоговую экологическую тяжесть {score}/100.",
    fieldNote:
      "Полевая заметка автора сохранена вместе с оценкой, но не использовалась для повышения визуального балла сверх подтверждения.",
    fallback:
      "Итоговая тяжесть {score}/100 ({quality}). Получена по {count} визуальным индикаторам.",
  },
  recommendations: {
    litter:
      "Организовать уборку берега и установить плавучее заграждение у ближайшего притока.",
    oil: "Сообщить о предполагаемом разливе нефтепродуктов в региональную экологическую инспекцию в течение 24 часов.",
    algae:
      "Найти источники биогенов выше по течению — обычно это сельскохозяйственный сток и неочищенные бытовые воды.",
    sewage:
      "Взять пробы на ПАВ и колиформные бактерии; проверить ближайшие выпуски на незаконные врезки.",
    deadFish:
      "Немедленно эскалировать: замор рыбы означает острую токсичность или кислородный коллапс.",
    industrial:
      "Зафиксировать расположение выпуска и запросить у надзорного органа разрешение оператора на сброс.",
    critical:
      "Ограничить контакт людей с водой до завершения лабораторных исследований.",
    poor: "Назначить повторную фотосъёмку каждые 7 дней для отслеживания динамики.",
    moderate: "Добавить точку в ежемесячный график наблюдений.",
    healthy:
      "Состояние благополучное — переснимать посезонно, чтобы задать базовый уровень.",
    moreAngles:
      "Загрузить дополнительные ракурсы (берег, приток, исток), чтобы повысить уверенность анализа.",
  },
};

const kk: AnalysisCopy = {
  notes: {
    clarityLow:
      "Мөлдірлігі төмен: контраст {contrast}%, тұнба реңкі айқын.",
    clarityOk: "Су бағанасы жеткілікті мөлдір (контраст {contrast}%).",
    sediment: "Кадрдың {pct}% бөлігінде жылы лай реңкі.",
    algae:
      "Жасыл арна қызыл мен көктен {pct}% асып тұр — балдыр биомассасына тән.",
    eutrophication:
      "Беттегі қалың өсімдік биогендік жүктеменің жоғарылағанын көрсетеді.",
    foam: "Беттің {pct}% бөлігінде жарық, қанықсыз текстура.",
    oil: "Беттің қараңғы аймақтарында кемпірқосақ реңк шашырауы ({pct}%).",
    unnaturalColour:
      "Пиксельдердің {pct}% табиғи суда сирек кездесетін реңк диапазонына түседі.",
    litter:
      "Бет бойында бөлшектенген контрастты шекаралар (шекара тығыздығы {pct}%).",
    plastic:
      "Жарық, қанық, геометриясы бұрыс фрагменттер — қаптама қалдықтарына тән.",
    observationOnly:
      "Орындағы бақылаушы хабарлаған; бұл кадрда тәуелсіз расталмайды.",
    corroborated: "Есеп авторының бақылауымен расталды.",
  },
  objects: {
    sediment: "Тұнбалы су",
    algalMats: "Жасыл балдыр төсеніштері",
    foam: "Бетіндегі көбік",
    oilSheen: "Мұнай қабыршағы",
    plume: "Түсі өзгерген ағын",
    debris: "Жүзіп жүрген қоқыс",
    plastic: "Пластик сынықтары",
    openWater: "Ашық су беті",
  },
  scene: {
    light: {
      bright: "жарық түскен",
      dim: "күңгірт",
      even: "біркелкі жарықтандырылған",
    },
    tone: {
      green: "жасылдау реңкті",
      brown: "қоңыр реңкті",
      neutral: "бейтарап реңкті",
    },
    summary: "{light}, {tone} су беті, жиынтық ауырлығы {score}/100.",
    fallback: "Су айдыны бетінің фотосуреті.",
  },
  explain: {
    drivers: "Кадрдың колориметриялық талдауы анықтады: {list}.",
    driverItem: "{label} ({severity}/100)",
    noDrivers:
      "Бұл кадрда антропогендік ластанудың елеулі белгілерін өлшеу мүмкін болмады.",
    clarityPoor:
      "Судың мөлдірлігі нашар — жарықтық контрасты {pct}%, тұнба реңкі ауыр.",
    clarityOk: "Судың мөлдірлігі қолайлы, жарықтық контрасты {pct}%.",
    composite:
      "Салмақталған индикатор матрицасы {score}/100 жиынтық экологиялық ауырлық береді.",
    fieldNote:
      "Автордың далалық жазбасы бағамен бірге сақталды, бірақ көрнекі балды растаудан тыс көтеру үшін қолданылмады.",
    fallback:
      "Жиынтық ауырлық {score}/100 ({quality}). {count} көрнекі индикатор бойынша алынды.",
  },
  recommendations: {
    litter:
      "Жағалауды тазалау жұмысын ұйымдастырып, ең жақын құйылысқа жүзбелі тосқауыл орнату.",
    oil: "Мұнай өнімдерінің төгілу күдігін аймақтық экологиялық инспекцияға 24 сағат ішінде хабарлау.",
    algae:
      "Ағыс жоғарысындағы биоген көздерін анықтау — әдетте бұл ауылшаруашылық ағыны мен тазартылмаған тұрмыстық су.",
    sewage:
      "Беттік-белсенді заттар мен колиформды бактерияларға сынама алу; жақын шығысты заңсыз қосылымға тексеру.",
    deadFish:
      "Дереу эскалациялау: балықтың қырылуы жедел уыттылықты немесе оттегі коллапсын білдіреді.",
    industrial:
      "Шығыс орнын тіркеп, реттеушіден оператордың төгінді рұқсатын сұрату.",
    critical:
      "Зертханалық зерттеу аяқталғанша адамдардың сумен жанасуын шектеу.",
    poor: "Динамиканы бақылау үшін әр 7 күн сайын қайта түсіру жоспарлау.",
    moderate: "Нүктені айлық бақылау кестесіне қосу.",
    healthy:
      "Жағдай қолайлы — базалық деңгей белгілеу үшін маусым сайын қайта түсіру.",
    moreAngles:
      "Талдау сенімділігін арттыру үшін қосымша ракурстар (жағалау, құйылыс, ағыс) жүктеу.",
  },
};

const COPY: Record<Locale, AnalysisCopy> = { en, ru, kk };

export function analysisCopy(locale: Locale = DEFAULT_LOCALE): AnalysisCopy {
  return COPY[locale] ?? COPY[DEFAULT_LOCALE];
}
