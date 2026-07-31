const SEARCH = 'https://www.ncbi.nlm.nih.gov/books/?term=';

const rows = [
  // 1 小児保健
  ['maternal-child-health-record', '母子健康手帳と健診時期', '母子健康手帳と健診時期', '小児保健', '小児保健', '乳幼児', '公的帳票', '月齢ごとの健診・発育・予防接種記録', '継続的な記録から成長と健康課題を捉える', '母子健康手帳は単回所見ではなく縦断情報として読む', 'https://www.bosei-navi.mhlw.go.jp/glossary/life01.html', '厚生労働省'],
  ['child-immunization-schedule', '予防接種スケジュール', '予防接種スケジュール', '小児保健', '小児保健', '乳児〜思春期', 'スケジュール表', '年齢・接種間隔・定期／任意接種の区分', '年齢と既接種歴から次の接種を判断する', '同時接種可否と最小間隔を個別に確認する', 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html', 'Centers for Disease Control and Prevention'],
  ['infant-physical-examination', '乳幼児身体診察', '乳幼児身体診察', '小児保健', '小児保健', '新生児〜乳幼児', '診察図', '全身観察、頭頸部、心肺、腹部、股関節、神経所見', '年齢に応じた正常所見と左右差を確認する', '診察は発達段階とバイタルサインを合わせて解釈する', 'https://www.ncbi.nlm.nih.gov/books/NBK310591/', 'NCBI Bookshelf'],
  ['non-accidental-injury-patterns', '被虐待を疑う損傷パターン', '被虐待を疑う損傷パターン', '小児保健', '小児保健', '乳児〜学童', 'X線・皮膚所見', '発達段階と合わない損傷、多発・新旧混在骨折、特徴的分布', '損傷機序と説明の整合性を評価する', '疑いだけで単独断定せず安全確保と多職種評価を優先する', 'https://www.ncbi.nlm.nih.gov/books/NBK499836/', 'NCBI Bookshelf'],

  // 2 成長・発達
  ['standard-growth-chart', '標準成長曲線', '標準成長曲線', '成長・発達', '成長・発達', '出生〜思春期', '成長曲線', '身長・体重のパーセンタイルと経時的な軌道', '1点ではなく曲線の傾きとチャネル横断を読む', '集団基準に対する位置と成長速度を分けて評価する', 'https://www.who.int/tools/child-growth-standards', 'World Health Organization'],
  ['head-circumference-chart', '頭囲曲線', '頭囲曲線', '成長・発達', '成長・発達', '出生〜乳幼児', '成長曲線', '頭囲パーセンタイルと急な上昇・停滞', '身長・体重との釣り合いと家族歴を確認する', '頭囲は脳・頭蓋の成長を反映し測定誤差にも注意する', 'https://www.who.int/tools/child-growth-standards/standards/head-circumference-for-age', 'World Health Organization'],
  ['bone-age-hand-xray', '骨年齢', '骨年齢', '成長・発達', '成長・発達', '幼児〜思春期', '手部X線', '手根骨出現と骨端核の成熟度', '暦年齢との差と成長速度を統合する', '骨成熟の進行度から残存成長と内分泌疾患を評価する', SEARCH + encodeURIComponent('bone age pediatric'), 'NCBI Bookshelf'],
  ['developmental-milestones', '乳幼児発達マイルストーン', '乳幼児発達マイルストーン', '成長・発達', '成長・発達', '乳幼児', '発達表', '粗大運動、微細運動、言語、社会性の獲得順序', '領域別の遅れと退行の有無を確認する', '発達は幅があるが退行は警告所見として扱う', 'https://www.cdc.gov/act-early/milestones/index.html', 'Centers for Disease Control and Prevention'],
  ['short-stature-growth-pattern', '低身長パターン', '低身長パターン', '成長・発達', '成長・発達', '幼児〜思春期', '成長曲線', '成長速度低下、標的身長との乖離、体重との関係', '家族性・体質性と病的低身長の曲線を比較する', '内分泌性では体重が保たれ全身疾患では体重も低下しやすい', SEARCH + encodeURIComponent('short stature children'), 'NCBI Bookshelf'],

  // 3 栄養
  ['pediatric-nutritional-assessment', '栄養評価曲線', '栄養評価曲線', '栄養', '栄養', '乳児〜思春期', '成長曲線', '身長体重比、BMI、上腕周囲長と推移', '急性・慢性の栄養障害を区別する', '複数の身体計測と摂取・疾患背景を統合する', 'https://www.who.int/tools/child-growth-standards', 'World Health Organization'],
  ['protein-energy-malnutrition', '蛋白エネルギー栄養障害', '蛋白エネルギー栄養障害', '栄養', '栄養', '乳幼児', '身体所見', '皮下脂肪・筋量低下、浮腫、毛髪・皮膚変化', 'marasmusとkwashiorkorの所見を比較する', 'エネルギー・蛋白不足と感染が相互に増悪する', SEARCH + encodeURIComponent('protein energy malnutrition children'), 'NCBI Bookshelf'],
  ['vitamin-deficiency-findings', 'ビタミン欠乏所見', 'ビタミン欠乏所見', '栄養', '栄養', '乳児〜思春期', '身体所見・X線', '骨端変化、出血、皮膚粘膜・神経所見', '食事歴と欠乏ビタミンに対応する所見を結ぶ', '欠乏所見は複数栄養素で重なるため検査で確認する', SEARCH + encodeURIComponent('vitamin deficiency pediatric'), 'NCBI Bookshelf'],
  ['enteral-feeding-devices', '経腸栄養デバイス', '経腸栄養デバイス', '栄養', '栄養', '乳児〜思春期', 'デバイス写真', '経鼻胃管、胃瘻、胃空腸瘻の位置と接続', '適応、先端位置、皮膚・接続部の安全を確認する', '消化管機能と誤嚥リスクに応じて経路を選択する', SEARCH + encodeURIComponent('enteral feeding tube children'), 'NCBI Bookshelf'],

  // 4 水・電解質
  ['pediatric-dehydration-signs', '脱水所見', '脱水所見', '水・電解質', '水・電解質', '乳児〜思春期', '身体所見', '意識、眼窩、口腔粘膜、皮膚、毛細血管再充満', '循環不全と脱水程度を分けて評価する', '体液喪失で循環血液量と組織灌流が低下する', SEARCH + encodeURIComponent('dehydration children clinical signs'), 'NCBI Bookshelf'],
  ['acid-base-nomogram', '酸塩基平衡図', '酸塩基平衡図', '水・電解質', '水・電解質', '新生児〜思春期', 'ノモグラム', 'pH、PaCO2、HCO3−の方向と代償', '一次性変化と代償の適切さを順に判定する', 'Henderson–Hasselbalch関係から呼吸性・代謝性変化を整理する', SEARCH + encodeURIComponent('acid base disorders pediatrics'), 'NCBI Bookshelf'],
  ['sodium-disorder-patterns', '低Na・高Na血症', '低Na・高Na血症', '水・電解質', '水・電解質', '新生児〜思春期', '診断フロー', '血清浸透圧、尿浸透圧、体液量の組合せ', 'Na値だけでなく水バランスと症状の時間経過を読む', '血清Naは体内Na総量より水との比を反映する', SEARCH + encodeURIComponent('hyponatremia hypernatremia children'), 'NCBI Bookshelf'],
  ['potassium-ecg-patterns', '低K・高K血症心電図', '低K・高K血症心電図', '水・電解質', '水・電解質', '新生児〜思春期', '心電図', 'T波、U波、PR、QRS幅の変化', 'K値と心電図変化を同時に確認する', '膜電位変化が再分極と伝導を障害し致死性不整脈を来しうる', SEARCH + encodeURIComponent('hypokalemia hyperkalemia ECG'), 'NCBI Bookshelf'],

  // 5 新生児
  ['neonatal-jaundice-pattern', '新生児黄疸', '新生児黄疸', '新生児', '新生児', '新生児', '身体所見・ノモグラム', '黄染の進展、日齢、時間別ビリルビン値', '出生後時間と在胎週数でリスクを判定する', '非抱合型・抱合型を区別し病的黄疸を見逃さない', 'https://publications.aap.org/pediatrics/article/150/3/e2022058859/188726/', 'American Academy of Pediatrics'],
  ['neonatal-intraventricular-hemorrhage', '新生児頭蓋内出血', '頭蓋内出血', '新生児', '新生児', '早産児', '頭部超音波', '胚層、脳室内高エコー、脳室拡大', '出血範囲と脳室・実質への進展を確認する', '早産児の脆弱な胚層血管から出血する', SEARCH + encodeURIComponent('germinal matrix intraventricular hemorrhage neonate'), 'NCBI Bookshelf'],
  ['hypoxic-ischemic-encephalopathy-mri', '低酸素性虚血性脳症', '低酸素性虚血性脳症', '新生児', '新生児', '新生児', 'MRI', '基底核視床、分水嶺、拡散強調像の異常', '受傷時期と低酸素パターンを画像分布から読む', '低酸素虚血によりエネルギー不全と遅発性細胞障害が生じる', SEARCH + encodeURIComponent('neonatal hypoxic ischemic encephalopathy MRI'), 'NCBI Bookshelf'],

  // 6 先天異常・遺伝
  ['chromosomal-microdeletion', '染色体微細欠失', '染色体微細欠失', '先天異常・遺伝', '遺伝・先天', '新生児〜思春期', '染色体マイクロアレイ', 'コピー数変化の位置・範囲と関連遺伝子', '表現型と検査結果の病原性評価を対応させる', '微細欠失は通常核型で見えずマイクロアレイ等で検出する', 'https://www.ncbi.nlm.nih.gov/books/NBK279899/', 'NCBI Bookshelf / GeneReviews'],

  // 7 先天代謝
  ['mucopolysaccharidosis-skeletal-survey', 'ムコ多糖症骨格', 'ムコ多糖症骨格', '先天代謝異常，代謝性疾患', '先天代謝', '乳幼児〜学童', 'X線', 'dysostosis multiplex、肋骨・椎体・長管骨変形', '粗な顔貌・関節拘縮など全身所見と統合する', 'リソソーム酵素欠損でGAGが蓄積し多臓器障害を来す', 'https://www.ncbi.nlm.nih.gov/books/NBK1162/', 'NCBI Bookshelf / GeneReviews'],
  ['organic-acidemia-brain-mri', '有機酸代謝異常MRI', '有機酸代謝異常MRI', '先天代謝異常，代謝性疾患', '先天代謝', '新生児〜乳幼児', 'MRI', '基底核病変、白質異常、脳萎縮', '代謝性アシドーシス・高アンモニア血症と画像を統合する', '有機酸蓄積と二次的ミトコンドリア障害が中枢神経を障害する', SEARCH + encodeURIComponent('organic acidemia MRI children'), 'NCBI Bookshelf'],
  ['wilson-kayser-fleischer-ring', 'Wilson病角膜所見', 'Wilson病角膜所見', '先天代謝異常，代謝性疾患', '先天代謝', '学童〜思春期', '細隙灯写真', '角膜周辺部Descemet膜の褐色環', '肝障害・神経症状と銅代謝検査を合わせる', 'ATP7B異常による銅排泄障害で肝・脳・角膜に蓄積する', 'https://www.ncbi.nlm.nih.gov/books/NBK1512/', 'NCBI Bookshelf / GeneReviews'],
  ['lysosomal-storage-smear', 'ライソゾーム病の末梢血・骨髄像', 'ライソゾーム病の末梢血・骨髄像', '先天代謝異常，代謝性疾患', '先天代謝', '乳児〜思春期', '血液塗抹・骨髄', '空胞化リンパ球、蓄積細胞、sea-blue histiocyte', '形態所見を酵素・遺伝学的検査へつなぐ', '分解酵素欠損により基質が細胞内ライソゾームへ蓄積する', SEARCH + encodeURIComponent('lysosomal storage disease bone marrow smear'), 'NCBI Bookshelf'],

  // 8 内分泌
  ['congenital-hypothyroidism-features', '先天性甲状腺機能低下症', '先天性甲状腺機能低下症', '内分泌', '内分泌', '新生児〜乳児', '身体所見・シンチグラフィ', '遷延性黄疸、巨舌、臍ヘルニア、甲状腺位置', '新生児マススクリーニング結果を直ちに確認する', '甲状腺形成異常やホルモン合成障害で甲状腺ホルモンが不足する', SEARCH + encodeURIComponent('congenital hypothyroidism'), 'NCBI Bookshelf'],
  ['congenital-adrenal-hyperplasia', '先天性副腎過形成', '先天性副腎過形成', '内分泌', '内分泌', '新生児〜乳児', '診断フロー・外性器所見', '外性器、電解質、17-OHPの組合せ', '循環不全と塩喪失クリーゼを先に評価する', '多くは21水酸化酵素欠損でコルチゾール低下とアンドロゲン過剰を来す', 'https://www.ncbi.nlm.nih.gov/books/NBK1171/', 'NCBI Bookshelf / GeneReviews'],
  ['pediatric-dka-flow', '糖尿病性ケトアシドーシス', '糖尿病性ケトアシドーシス', '内分泌', '内分泌', '小児〜思春期', '診断・治療フロー', '高血糖、ケトン、代謝性アシドーシス、脱水所見', '意識・循環と脳浮腫警告徴候を連続評価する', 'インスリン欠乏で脂肪分解とケトン産生が亢進する', 'https://www.ispad.org/resource/chapter-11-diabetic-ketoacidosis.html', 'International Society for Pediatric and Adolescent Diabetes'],
  ['pituitary-mri', '下垂体MRI', '下垂体MRI', '内分泌', '内分泌', '小児〜思春期', 'MRI', '下垂体前葉・後葉、茎、視交叉、周囲腫瘤', 'ホルモン欠損パターンと形態異常を対応させる', '発生異常・腫瘍・炎症で複数の下垂体機能異常を来しうる', SEARCH + encodeURIComponent('pituitary MRI children'), 'NCBI Bookshelf'],
  ['differences-sex-development-imaging', '性分化疾患の画像評価', '性分化疾患の画像評価', '内分泌', '内分泌', '新生児〜思春期', '超音波・MRI', '性腺、子宮、膣、尿路の有無と位置', '画像だけで性別を決めず内分泌・遺伝学を統合する', '染色体・性腺・ホルモン作用の各段階の差異で表現型が生じる', 'https://www.ncbi.nlm.nih.gov/books/NBK279170/', 'NCBI Bookshelf / Endotext'],

  // 9 生体防御・免疫
  ['primary-immunodeficiency-thymus', '原発性免疫不全の胸腺陰影', '原発性免疫不全の胸腺陰影', '生体防御・免疫', '免疫', '新生児〜乳児', '胸部X線', '胸腺陰影の欠如または低形成', '乳児感染歴・リンパ球数と胸腺像を統合する', 'T細胞分化障害では胸腺低形成と重症感染を来しうる', SEARCH + encodeURIComponent('primary immunodeficiency absent thymic shadow infant'), 'NCBI Bookshelf'],
  ['chronic-granulomatous-disease-test', '慢性肉芽腫症検査像', '慢性肉芽腫症検査像', '生体防御・免疫', '免疫', '乳児〜思春期', 'フローサイトメトリー', 'DHR酸化反応の低下・欠如パターン', 'カタラーゼ陽性菌・真菌反復感染と結ぶ', 'NADPH oxidase異常で好中球の活性酸素産生が障害される', 'https://www.ncbi.nlm.nih.gov/books/NBK99496/', 'NCBI Bookshelf / GeneReviews'],
  ['hemophagocytosis-marrow', '血球貪食像', '血球貪食像', '生体防御・免疫', '免疫', '乳児〜思春期', '骨髄', '組織球内の赤血球・血球成分貪食', '臨床・検査基準を満たすかを総合評価する', '過剰な免疫活性化とサイトカイン放出で多臓器障害が進行する', SEARCH + encodeURIComponent('hemophagocytic lymphohistiocytosis bone marrow'), 'NCBI Bookshelf'],
  ['complement-deficiency-pattern', '補体異常の検査パターン', '補体異常の検査パターン', '生体防御・免疫', '免疫', '小児〜思春期', '検査パターン', 'CH50・AH50・C3・C4の組合せ', '古典・代替・終末経路のどこが障害されるかを読む', '経路別スクリーニングから欠損成分と消費性低下を区別する', SEARCH + encodeURIComponent('complement deficiency CH50 AH50'), 'NCBI Bookshelf'],
];

export function createCompletionBatch0109({ linkOnly, R, C, I, D }) {
  return rows.map((row, index) => {
    const [slug, title, target, curriculumDomain, category, ageGroup, modality,
      finding, clue, mechanism, url, organization] = row;
    const source = linkOnly({
      title: `${title}：原典画像・図表`,
      url,
      organization,
      pediatric: true,
    });
    return C({
      id: 101 + index,
      slug,
      title,
      category,
      curriculumDomain,
      coverageTargets: [target],
      ageGroup,
      difficulty: 2,
      frequency: 4,
      typicality: 4,
      clinicalSummary: `${title}を視覚所見から認識し、年齢・経過・検査所見と統合する。`,
      image: I(`${slug}-source`, source, modality, `${title}の原典画像・図表`, finding),
      firstLook: [finding],
      keyFindings: finding.split('、'),
      diagnosticClues: [clue],
      differentialDiagnoses: [
        D('正常範囲・生理的変化', '年齢、発達段階、経時変化と照合する'),
        D('類似する二次性変化', '臨床経過と確認検査で区別する'),
      ],
      explanation: `${clue}。視覚所見単独で確定せず、原典に示された評価手順と臨床情報を統合する。`,
      pathology: mechanism,
      nextTests: ['年齢に応じた基準値・評価尺度で再確認する', '疑われる病態に対応する確認検査を行う'],
      initialManagement: ['重症度と緊急性を先に評価する', '必要に応じて該当専門領域へ早期に連携する'],
      examPearls: [clue, finding],
      pitfalls: ['単一画像・単一時点だけで診断を確定しない'],
      relatedCases: [],
      clinicalReferences: [R(title, organization, url)],
    });
  });
}
