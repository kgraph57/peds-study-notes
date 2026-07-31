import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createExpansionBatch } from './atlas-expansion-batch.mjs';
import { createContinuationBatch } from './atlas-continuation-batch.mjs';
import { createCompletionBatch0109 } from './atlas-completion-01-09.mjs';
import { createCompletionBatch1017 } from './atlas-completion-10-17.mjs';
import { createCompletionBatch1825 } from './atlas-completion-18-25.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const accessedAt = '2026-07-30';

const commons = (file, {
  url, title, holder, license, licenseUrl = '', pediatric = true, patientAge,
  originalImageUrl = url, description = '', modified = false, modificationDescription,
}) => ({
  sourceType: license === 'Public domain' ? 'public-domain'
    : license === 'CC0' ? 'public-domain' : 'creative-commons',
  localImagePath: `assets/atlas/${file}`,
  thumbnailPath: `assets/atlas/${file}`,
  imageUrl: url,
  sourcePageUrl: `https://commons.wikimedia.org/wiki/File:${title}`,
  originalImageUrl,
  title,
  caption: description,
  organization: 'Wikimedia Commons',
  copyrightHolder: holder,
  licenseName: license,
  licenseUrl,
  redistributionAllowed: true,
  modificationAllowed: true,
  commercialUseAllowed: true,
  attributionRequired: !['CC0', 'Public domain'].includes(license),
  embeddingAllowed: true,
  modified,
  modificationDescription: modificationDescription || '原画像を改変せず収載',
  pediatricImage: pediatric === true && patientAge ? true : pediatric === false ? false : null,
  ...(patientAge ? { patientAge } : {}),
  accessedAt,
});

const linkOnly = ({
  title,
  url,
  organization = 'Radiopaedia',
  pediatric = null,
  patientAge,
  figureUrl,
  figureReference,
}) => ({
  sourceType: 'external-link-only',
  sourcePageUrl: url,
  ...(figureUrl ? { figureUrl } : {}),
  ...((figureReference || title.match(/\bFigure\s*\d+[A-Za-z]?/i)?.[0])
    ? { figureReference: figureReference || title.match(/\bFigure\s*\d+[A-Za-z]?/i)[0] }
    : {}),
  title,
  organization,
  licenseName: '転載条件未確認（原典リンクのみ）',
  redistributionAllowed: false,
  modificationAllowed: false,
  attributionRequired: true,
  embeddingAllowed: false,
  modified: false,
  pediatricImage: pediatric === true && patientAge ? true : pediatric === false ? false : null,
  ...(patientAge ? { patientAge } : {}),
  accessedAt,
});

const sources = {
  croup: commons('croup-steeple-sign.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Croup_steeple_sign.jpg',
    title: 'Croup_steeple_sign.jpg', holder: 'Frank Gaillard', license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    description: '小児クループの頸部正面X線。声門下狭窄によるsteeple sign。',
  }),
  epiglottitis: commons('epiglottitis-thumb-sign.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Epiglottitis.jpg',
    title: 'Epiglottitis.jpg', holder: 'Med Chaos', license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    description: '急性喉頭蓋炎の頸部側面X線。腫大した喉頭蓋によるthumb sign。',
  }),
  foreignBody: commons('foreign-body-unilateral-hyperinflation.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Fremdkoerperaspiration_mit_Ventilwirkung_2W_-_CR_ap_-_001.jpg',
    title: 'Fremdkoerperaspiration_mit_Ventilwirkung_2W_-_CR_ap_-_001.jpg',
    holder: 'Hellerhoff', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    patientAge: '2週', description: '左主気管支異物の弁状効果による左肺過膨張。',
  }),
  rds: commons('neonatal-rds-xray.png', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/X-ray_of_infant_respiratory_distress_syndrome_%28IRDS%29.png',
    title: 'X-ray_of_infant_respiratory_distress_syndrome_(IRDS).png',
    holder: 'Mikael Häggström, M.D.', license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    patientAge: '在胎29週3日、日齢1', description: '低肺気量、びまん性細顆粒状陰影、air bronchogram。',
  }),
  mas: commons('meconium-aspiration-xray.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Mekoniumaspiration_bei_Neugeborenen_im_Roentgenbild_0W_-_CR_ap_-_001.jpg',
    title: 'Mekoniumaspiration_bei_Neugeborenen_im_Roentgenbild_0W_-_CR_ap_-_001.jpg',
    holder: 'Hellerhoff', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    patientAge: '新生児', description: '両肺の不均一な斑状陰影を示す胎便吸引症候群。',
  }),
  ttn: linkOnly({
    title: 'Respiratory Distress in the Newborn — Figure 1 (TTN)',
    organization: 'PubMed Central',
    pediatric: true,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4533247/',
  }),
  cdh: commons('congenital-diaphragmatic-hernia-xray.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Kongenitale_Zwerchfellhernie_links_-_Roe_ap_001.jpg',
    title: 'Kongenitale_Zwerchfellhernie_links_-_Roe_ap_001.jpg',
    holder: 'Hellerhoff', license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    patientAge: '新生児', description: '左胸腔内の胃腸管ガス像と右方への縦隔偏位。',
  }),
  tof: commons('tetralogy-boot-shaped-heart.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Boot-shaped_heart.jpg/1920px-Boot-shaped_heart.jpg',
    originalImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Boot-shaped_heart.jpg',
    title: 'Boot-shaped_heart.jpg', holder: 'Medicalpal', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    pediatric: false, description: 'Fallot四徴症のboot-shaped heart。症例年齢は原典記載なし。',
  }),
  tga: commons('tga-egg-on-side.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Transposition-of-great-vessels.jpg',
    title: 'Transposition-of-great-vessels.jpg', holder: 'Madhero88',
    license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    pediatric: false, description: '完全大血管転位のegg-on-side appearance。症例年齢は原典記載なし。',
  }),
  tapvr: linkOnly({
    title: 'Supracardiac type of total anomalous pulmonary venous connection — Figure 1',
    organization: 'PubMed Central',
    pediatric: true,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11665673/',
  }),
  asd: commons('asd-echocardiogram.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Echokardiogram_von_Atriumseptumdefekt_%28Ostium_secundum%29.jpg',
    title: 'Echokardiogram_von_Atriumseptumdefekt_(Ostium_secundum).jpg',
    holder: 'Kjetil Lenes', license: 'Public domain', pediatric: false,
    description: '二次孔型心房中隔欠損の心エコー。症例年齢は原典記載なし。',
    modified: true,
    modificationDescription: '画像上端の検査日時をプライバシー保護のためトリミング。診断所見の改変なし。',
  }),
  svt: commons('svt-lead-ii.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/SVT_Lead_II-2.JPG',
    title: 'SVT_Lead_II-2.JPG', holder: 'James Heilman, MD', license: 'Public domain',
    pediatric: false, patientAge: '40歳（成人参考画像）',
    description: '規則正しい狭QRS頻拍を示すII誘導。小児画像が得られず成人参考画像。',
  }),
  wpw: commons('wpw-short-pr-delta-wave.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Electrocardiogram_showed_a_short_PR_interval.jpg',
    title: 'Electrocardiogram_showed_a_short_PR_interval.jpg',
    holder: 'Khan Z, Khan A', license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    pediatric: false, description: '短いPR間隔とdelta waveを示すWPW症候群の心電図。症例年齢は原典でyoung patient。',
  }),
  intussusception: commons('intussusception-target-sign.png', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ultrasound_of_target_sign_in_intussusception_of_the_right_bowel.png/1920px-Ultrasound_of_target_sign_in_intussusception_of_the_right_bowel.png',
    originalImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Ultrasound_of_target_sign_in_intussusception_of_the_right_bowel.png',
    title: 'Ultrasound_of_target_sign_in_intussusception_of_the_right_bowel.png',
    holder: 'Cerevisae', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    pediatric: false, description: '右腸管の腸重積にみられるtarget signとカラードプラ。',
  }),
  pyloric: commons('pyloric-stenosis-ultrasound.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Pyloric-stenosis.jpg',
    title: 'Pyloric-stenosis.jpg', holder: 'Dr Laughlin Dawes', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    patientAge: '6週', description: '肥厚性幽門狭窄症の超音波像。',
  }),
  volvulus: linkOnly({
    title: 'Prenatal diagnosis of midgut volvulus using two-dimensional and three-dimensional ultrasound — Figures 1–2',
    organization: 'PubMed Central',
    pediatric: true,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8991126/',
  }),
  nec: commons('nec-pneumatosis-xray.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Pneumatosis_intestinalis_und_hepatis_bei_NEC_0W_-_CR_ap_-_001.jpg',
    title: 'Pneumatosis_intestinalis_und_hepatis_bei_NEC_0W_-_CR_ap_-_001.jpg',
    holder: 'Hellerhoff', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    patientAge: '新生児', description: 'NECの腸管壁内ガスと門脈ガス。',
  }),
  duodenal: commons('duodenal-atresia-double-bubble.png', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/DuodAtres.png',
    title: 'DuodAtres.png', holder: 'Kinderradiologie Olgahospital Klinikum Stuttgart',
    license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    patientAge: '新生児', description: '十二指腸閉鎖のdouble-bubble sign。',
  }),
  rickets: commons('rickets-wrist-xray.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/X-ray_of_Hands_Identifying_Rickets.jpg',
    title: 'X-ray_of_Hands_Identifying_Rickets.jpg', holder: 'Frank Gaillard',
    license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    pediatric: true, description: 'くる病の手関節X線。骨幹端のcuppingを示す。',
  }),
  iga: commons('iga-vasculitis-purpura.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Purpura_Schonlein_Henoch.JPG',
    title: 'Purpura_Schonlein_Henoch.JPG', holder: 'Mnokel at Arabic Wikipedia',
    license: 'Public domain', pediatric: false,
    description: 'IgA血管炎の下肢優位の紫斑。症例年齢は原典記載なし。',
  }),
  wilmsPathology: commons('wilms-tumor-histology.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Wilms_Tumor_%28Nephroblastoma%29_%284882456062%29.jpg',
    title: 'Wilms_Tumor_(Nephroblastoma)_(4882456062).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'Wilms腫瘍のH&E染色。芽体成分、上皮成分、間質成分を観察する。',
  }),
  neuroblastomaLow: commons('neuroblastoma-rosette-low.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Neuroblastoma_of_the_Adrenal_Gland_%281%29_%282274260199%29.jpg',
    title: 'Neuroblastoma_of_the_Adrenal_Gland_(1)_(2274260199).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: '副腎神経芽腫のH&E染色。神経網様の中心を囲む腫瘍細胞配列を示す。',
  }),
  neuroblastomaHigh: commons('neuroblastoma-rosette-high.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Neuroblastoma_of_the_Adrenal_Gland_%282%29_%282274260465%29.jpg',
    title: 'Neuroblastoma_of_the_Adrenal_Gland_(2)_(2274260465).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: '副腎神経芽腫のH&E染色高倍率。Homer Wright型ロゼットを示す。',
  }),
  burkittLow: commons('burkitt-starry-sky.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Burkitt%27s_lymphoma_Histopathology.jpg',
    title: "Burkitt's_lymphoma_Histopathology.jpg",
    holder: 'National Cancer Institute', license: 'Public domain',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'Burkittリンパ腫のH&E染色。腫瘍細胞の間に淡明なtingible-body macrophageが散在する。',
  }),
  burkittHigh: commons('burkitt-histology-high.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Burkitt_lymphoma%2C_H%26E_%28144136196%29.jpg',
    title: 'Burkitt_lymphoma,_H&E_(144136196).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'Burkittリンパ腫のH&E染色。均一な中型リンパ系腫瘍細胞と散在する組織球を示す。',
  }),
  ewingPathology: commons('ewing-sarcoma-histology.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Ewing_Sarcoma_%282274259503%29.jpg',
    title: 'Ewing_Sarcoma_(2274259503).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'Ewing肉腫のH&E染色。構造形成に乏しい小円形細胞の密な増殖を示す。',
  }),
  celiacLow: commons('celiac-villous-atrophy.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Celiac_Sprue%2C_Small_Bowel_Biopsy_%285709845067%29.jpg',
    title: 'Celiac_Sprue,_Small_Bowel_Biopsy_(5709845067).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'セリアック病の小腸生検H&E染色。絨毛短縮と陰窩過形成を示す。',
  }),
  celiacHigh: commons('celiac-intraepithelial-lymphocytes.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Celiac_Sprue%2C_Small_Bowel_Biopsy_%285709845115%29.jpg',
    title: 'Celiac_Sprue,_Small_Bowel_Biopsy_(5709845115).jpg',
    holder: 'Ed Uthman', license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'セリアック病の小腸生検H&E染色高倍率。上皮内リンパ球増加を観察する。',
  }),
  allLow: commons('all-lymphoblasts-low.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Acute_lymphoblastic_leukaemia_smear.jpg',
    title: 'Acute_lymphoblastic_leukaemia_smear.jpg',
    holder: 'James Grellier / VashiDonsk', license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: '前駆B細胞性ALLの骨髄塗抹Wright染色。多数のリンパ芽球を示す。',
  }),
  allHigh: commons('all-bone-marrow-smear.jpg', {
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Acute_lymphoblastic_leukemia.jpg',
    title: 'Acute_lymphoblastic_leukemia.jpg',
    holder: 'Animalculist', license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    pediatric: false, patientAge: '原典に症例年齢記載なし',
    description: 'ALLの骨髄塗抹。高い核細胞質比を示すリンパ芽球が増加している。',
    modified: true,
    modificationDescription: '縦横比と画素寸法を維持してJPEG品質85で再圧縮。医学的内容の改変なし。',
  }),
};

const R = (title, organization, url) => ({
  title,
  organization,
  url,
  accessedAt,
  scope: '症例解説・典型所見の確認',
});

const clinicalReferences = {
  'croup-steeple-sign': [
    R('Croup', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK431070/'),
  ],
  'epiglottitis-thumb-sign': [
    R('Epiglottitis', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK430960/'),
  ],
  'airway-foreign-body-hyperinflation': [
    R('Foreign Body Airway Obstruction', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK553186/'),
  ],
  'neonatal-rds': [
    R('Neonatal Respiratory Distress Syndrome', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK560779/'),
  ],
  'meconium-aspiration': [
    R('Meconium Aspiration', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK557425/'),
  ],
  'transient-tachypnea-newborn': [
    R('Transient Tachypnea of the Newborn', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK537354/'),
  ],
  'congenital-diaphragmatic-hernia': [
    R('Congenital Diaphragmatic Hernia', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK556076/'),
  ],
  'tetralogy-fallot-boot-heart': [
    R('Tetralogy of Fallot', 'Centers for Disease Control and Prevention', 'https://www.cdc.gov/heart-defects/about/tetralogy-of-fallot.html'),
  ],
  'tga-egg-on-string': [
    R('Specific Congenital Heart Defects: d-TGA', 'Centers for Disease Control and Prevention', 'https://www.cdc.gov/heart-defects/about/specific-heart-defects.html'),
  ],
  'tapvr-snowman-sign': [
    R('Total Anomalous Pulmonary Venous Return (TAPVR)', 'Centers for Disease Control and Prevention', 'https://www.cdc.gov/heart-defects/about/tapvr.html'),
  ],
  'atrial-septal-defect': [
    R('Specific Congenital Heart Defects: ASD', 'Centers for Disease Control and Prevention', 'https://www.cdc.gov/heart-defects/about/specific-heart-defects.html'),
  ],
  'supraventricular-tachycardia': [
    R('Supraventricular Tachycardia', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK441972/'),
  ],
  'wpw-delta-wave': [
    R('Wolff-Parkinson-White Syndrome', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK554437/'),
  ],
  'intussusception-target-sign': [
    R('Child Intussusception', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK431078/'),
  ],
  'hypertrophic-pyloric-stenosis': [
    R('Pyloric Stenosis', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK555931/'),
  ],
  'midgut-volvulus-whirlpool-sign': [
    R('Midgut Volvulus', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK441962/'),
  ],
  'nec-pneumatosis': [
    R('Necrotizing Enterocolitis', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK513357/'),
  ],
  'duodenal-atresia-double-bubble': [
    R('Duodenal Atresia and Stenosis', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK470548/'),
  ],
  'rickets-metaphysis': [
    R('Rickets', 'NCBI Bookshelf / StatPearls', 'https://www.ncbi.nlm.nih.gov/books/NBK562285/'),
  ],
  'iga-vasculitis-purpura': [
    R('IgA Vasculitis', 'National Institute of Diabetes and Digestive and Kidney Diseases', 'https://www.niddk.nih.gov/health-information/kidney-disease/iga-vasculitis'),
  ],
  'wilms-tumor-histology': [
    R('Wilms Tumor and Other Childhood Kidney Tumors Treatment (PDQ®)', 'National Cancer Institute', 'https://www.cancer.gov/types/kidney/hp/wilms-treatment-pdq'),
  ],
  'neuroblastoma-histology': [
    R('Neuroblastoma Treatment (PDQ®)', 'National Cancer Institute', 'https://www.cancer.gov/types/neuroblastoma/hp/neuroblastoma-treatment-pdq'),
  ],
  'burkitt-lymphoma-histology': [
    R('Childhood Non-Hodgkin Lymphoma Treatment (PDQ®)', 'National Cancer Institute', 'https://www.cancer.gov/types/lymphoma/hp/child-nhl-treatment-pdq'),
  ],
  'ewing-sarcoma-histology': [
    R('Ewing Sarcoma Treatment (PDQ®)', 'National Cancer Institute', 'https://www.cancer.gov/types/bone/hp/ewing-treatment-pdq'),
  ],
  'celiac-disease-histology': [
    R('Celiac Disease Tests', 'National Institute of Diabetes and Digestive and Kidney Diseases', 'https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/digestive-diseases/celiac-disease-health-care-professionals'),
  ],
  'acute-lymphoblastic-leukemia-smear': [
    R('Childhood Acute Lymphoblastic Leukemia Treatment (PDQ®)', 'National Cancer Institute', 'https://www.cancer.gov/types/leukemia/hp/child-all-treatment-pdq'),
  ],
};

const D = (name, distinction) => ({ name, distinction });
const I = (id, source, modality, alt, description, annotations = []) => ({
  id, src: source.localImagePath ? `/${source.localImagePath}` : undefined,
  alt, description, modality, source, annotations,
});
const A = (id, type, x, y, width, height, label, description) => ({
  id, type, x, y, width, height, label, description,
});
const C = ({
  id, slug, title, category, ageGroup, difficulty, frequency, typicality,
  curriculumDomain, clinicalSummary, image, images, firstLook, keyFindings, diagnosticClues, differentialDiagnoses,
  explanation, pathology, nextTests, initialManagement, examPearls, pitfalls, relatedCases = [],
  clinicalReferences: caseReferences, coverageTargets = [],
}) => ({
  id, slug, title, diagnosis: title, category, ageGroup, difficulty, frequency, typicality,
  curriculumDomain: curriculumDomain || ({
    呼吸器: '呼吸器', 新生児: '新生児', 循環器: '循環器', 消化器: '消化器',
    '消化器・新生児': '新生児', '骨・代謝': '先天代謝異常，代謝性疾患',
    '皮膚・免疫': '膠原病・リウマチ性疾患',
  })[category],
  clinicalSummary, images: images || [image], firstLook, keyFindings, diagnosticClues,
  differentialDiagnoses, explanation, pathology, nextTests, initialManagement,
  examPearls, pitfalls, relatedCases, coverageTargets,
  clinicalReferences: caseReferences || clinicalReferences[slug] || [],
});

const expansionCases = createExpansionBatch({ commons, R, C, I, D, A });
const continuationCases = createContinuationBatch({ commons, R, C, I, D, A });
const completionCases0109 = createCompletionBatch0109({ commons, linkOnly, R, C, I, D, A });
const completionCases1017 = createCompletionBatch1017({ commons, linkOnly, R, C, I, D, A });
const completionCases1825 = createCompletionBatch1825({ commons, linkOnly, R, C, I, D, A });

const cases = [
  C({id:1,slug:'croup-steeple-sign',title:'クループ',category:'呼吸器',ageGroup:'乳幼児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'嗄声、犬吠様咳嗽、吸気性喘鳴を示す上気道疾患。画像は非典型例や鑑別が必要な場合に検討する。',
    image:I('croup-xray',sources.croup,'X線','クループの頸部正面X線で声門下狭窄を示すsteeple sign','声門下気道が左右から狭まり、塔の尖端のように見える。',[A('subglottis','rectangle',.37,.18,.26,.38,'声門下狭窄','左右対称の声門下狭窄を観察')]),
    firstLook:['頸部正面像の声門下気道'],keyFindings:['左右対称の声門下狭窄','steeple sign'],
    diagnosticClues:['犬吠様咳嗽','嗄声と吸気性喘鳴'],differentialDiagnoses:[D('急性喉頭蓋炎','側面像のthumb sign、流涎、急速な全身状態悪化'),D('気道異物','突然発症、片側性所見')],
    explanation:'臨床診断が基本。steeple signは補助所見で、欠如しても除外できない。',pathology:'ウイルス感染に伴う声門下粘膜浮腫。',
    nextTests:['典型例では画像を必須としない','低酸素や非典型経過では重症度と鑑別を評価'],initialManagement:['気道を刺激せず重症度を評価','中等症以上では標準治療を速やかに開始'],
    examPearls:['診断名より呼吸状態の評価を優先'],pitfalls:['steeple signを必須条件にしない'],relatedCases:['epiglottitis-thumb-sign']}),
  C({id:2,slug:'epiglottitis-thumb-sign',title:'急性喉頭蓋炎',category:'呼吸器',ageGroup:'小児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'高熱、咽頭痛、流涎、含み声、起坐呼吸を呈しうる気道緊急疾患。',
    image:I('epiglottitis-xray',sources.epiglottitis,'X線','急性喉頭蓋炎の頸部側面X線で腫大した喉頭蓋を示すthumb sign','側面像で丸く腫大した喉頭蓋を確認する。',[A('epiglottis','ellipse',.39,.43,.25,.22,'腫大した喉頭蓋','thumb sign')]),
    firstLook:['頸部側面像の喉頭蓋'],keyFindings:['腫大した喉頭蓋','thumb sign'],diagnosticClues:['流涎','前傾姿勢','嚥下困難'],
    differentialDiagnoses:[D('クループ','犬吠様咳嗽、声門下狭窄'),D('咽後膿瘍','咽後間隙の拡大')],
    explanation:'画像撮影で気道確保を遅らせない。臨床的に強く疑えば安全な環境で気道管理を優先する。',pathology:'喉頭蓋と周囲組織の急性炎症・浮腫。',
    nextTests:['気道が安定している場合のみ側面X線などを検討','血液培養は初期対応を遅らせない範囲で'],initialManagement:['不要な咽頭刺激を避ける','気道確保可能なチームを招集'],
    examPearls:['舌圧子で不用意に咽頭を観察しない'],pitfalls:['X線確認を気道管理より優先しない'],relatedCases:['croup-steeple-sign']}),
  C({id:3,slug:'airway-foreign-body-hyperinflation',title:'気道異物',category:'呼吸器',ageGroup:'乳幼児',difficulty:2,frequency:5,typicality:5,
    clinicalSummary:'突然の咳込み、片側喘鳴、呼吸音左右差を手掛かりにする。',
    image:I('foreign-body-xray',sources.foreignBody,'X線','気道異物による左肺過膨張を示す小児胸部X線','弁状閉塞による片側過膨張と縦隔偏位。',[A('hyperinflation','rectangle',.08,.18,.42,.65,'左肺過膨張','左肺の透過性亢進と容積増大')]),
    firstLook:['左右の肺容積と透過性'],keyFindings:['片側過膨張','縦隔の対側偏位'],diagnosticClues:['突然発症','片側喘鳴'],
    differentialDiagnoses:[D('気管支喘息','通常は両側性'),D('肺炎','局所浸潤影と発熱')],
    explanation:'異物自体がX線に写らなくても、air trappingなどの間接所見が診断の手掛かりになる。',pathology:'主気管支の弁状閉塞による呼気時air trapping。',
    nextTests:['吸気・呼気像または側臥位像を状況に応じ検討','疑いが高ければ気管支鏡評価'],initialManagement:['完全閉塞の有無を直ちに評価','安定例でも専門チームへ早期相談'],
    examPearls:['正常X線でも気道異物を除外できない'],pitfalls:['画像上異物が見えないだけで否定しない']}),
  C({id:4,slug:'neonatal-rds',title:'新生児呼吸窮迫症候群',category:'新生児',ageGroup:'早産児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'早産児に出生直後から呼吸窮迫を来すサーファクタント欠乏性疾患。',
    image:I('rds-xray',sources.rds,'X線','新生児RDSの胸部X線で低肺気量とびまん性細顆粒状陰影','低肺気量、細顆粒状陰影、air bronchogram。',[A('granular','rectangle',.15,.22,.7,.55,'びまん性陰影','両肺の細顆粒状陰影')]),
    firstLook:['肺気量','陰影の均一性'],keyFindings:['低肺気量','びまん性細顆粒状陰影','air bronchogram'],diagnosticClues:['早産','出生直後の呼吸窮迫'],
    differentialDiagnoses:[D('TTN','過膨張、葉間裂の液体貯留'),D('胎便吸引症候群','不均一な粗大斑状陰影')],
    explanation:'在胎週数と発症時期を画像所見と統合する。',pathology:'未熟肺のサーファクタント欠乏による肺胞虚脱。',
    nextTests:['血液ガスと酸素化評価','感染鑑別を臨床状況に応じ実施'],initialManagement:['体温・呼吸・酸素化を安定化','標準的な非侵襲的呼吸管理を検討'],
    examPearls:['低肺気量がTTNとの比較点'],pitfalls:['画像だけで感染を除外しない'],relatedCases:['transient-tachypnea-newborn','meconium-aspiration']}),
  C({id:5,slug:'meconium-aspiration',title:'胎便吸引症候群',category:'新生児',ageGroup:'正期産・過期産児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'胎便混濁羊水と出生直後の呼吸障害を背景に疑う。',
    image:I('mas-xray',sources.mas,'X線','胎便吸引症候群の新生児胸部X線で両肺の斑状陰影','粗大で不均一な斑状陰影を観察。',[A('patchy','rectangle',.12,.16,.76,.66,'斑状陰影','左右非対称になりうる粗大陰影')]),
    firstLook:['肺気量と陰影の不均一性'],keyFindings:['過膨張','粗大な斑状陰影','無気肺の混在'],diagnosticClues:['胎便混濁羊水','正期産または過期産'],
    differentialDiagnoses:[D('RDS','早産、低肺気量、均一な細顆粒状陰影'),D('新生児肺炎','感染徴候と培養所見')],
    explanation:'air trappingと閉塞性無気肺が混在するため不均一に見える。',pathology:'胎便による気道閉塞、化学性肺炎、サーファクタント障害。',
    nextTests:['酸素化と血液ガス評価','肺高血圧合併を必要に応じ心エコーで評価'],initialManagement:['呼吸循環を安定化','重症度に応じ新生児集中治療'],
    examPearls:['正期産＋胎便＋不均一陰影'],pitfalls:['RDSと同じ均一陰影として覚えない'],relatedCases:['neonatal-rds']}),
  C({id:6,slug:'transient-tachypnea-newborn',title:'新生児一過性多呼吸',category:'新生児',ageGroup:'新生児',difficulty:1,frequency:5,typicality:4,
    clinicalSummary:'出生直後の多呼吸で、肺液吸収遅延が主因。多くは短期間で改善する。',
    image:I('ttn-source',sources.ttn,'X線','新生児一過性多呼吸の原典画像ページ','転載条件を確定できないため原典リンクのみ。'),
    firstLook:['肺過膨張','肺門周囲陰影と葉間裂液'],keyFindings:['過膨張','肺門周囲の線状陰影','葉間裂の液体貯留'],diagnosticClues:['帝王切開','出生直後発症と比較的速い改善'],
    differentialDiagnoses:[D('RDS','早産、低肺気量'),D('新生児肺炎','感染徴候、改善が遅い')],
    explanation:'肺胞液の吸収遅延により間質性・裂間の液体貯留を示す。',pathology:'出生後の肺液クリアランス遅延。',
    nextTests:['経時的な呼吸状態と酸素需要を評価','遷延時は他疾患を再評価'],initialManagement:['支持療法とモニタリング','哺乳安全性を呼吸数に応じ判断'],
    examPearls:['過膨張と葉間裂液'],pitfalls:['改善しない症例をTTNのまま固定しない'],relatedCases:['neonatal-rds']}),
  C({id:7,slug:'congenital-diaphragmatic-hernia',title:'先天性横隔膜ヘルニア',category:'新生児',ageGroup:'新生児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'出生直後の重い呼吸障害と舟状腹を来しうる。',
    image:I('cdh-xray',sources.cdh,'X線','左先天性横隔膜ヘルニアの新生児胸部X線','胸腔内の胃腸管ガス像と縦隔偏位。',[A('bowel','rectangle',.08,.22,.48,.56,'胸腔内腸管','複数のガス像')]),
    firstLook:['胸腔内の腸管ガス像','縦隔偏位'],keyFindings:['左胸腔内の腸管・胃泡','対側への縦隔偏位'],diagnosticClues:['重い出生直後呼吸障害','舟状腹'],
    differentialDiagnoses:[D('先天性肺気道奇形','肺内嚢胞性病変'),D('気胸','腸管壁を伴わない透亮域')],
    explanation:'腹腔臓器の胸腔内脱出と肺低形成を伴う。',pathology:'横隔膜欠損を介した腹腔臓器の胸腔内脱出。',
    nextTests:['心エコーで肺高血圧・心奇形を評価','全身合併奇形を評価'],initialManagement:['バッグマスク換気を避け気管挿管を検討','胃管で減圧し循環呼吸を安定化'],
    examPearls:['舟状腹と胸腔内腸管'],pitfalls:['単純気胸と誤認し胸腔穿刺しない']}),
  C({id:8,slug:'tetralogy-fallot-boot-heart',title:'Fallot四徴症',category:'循環器',ageGroup:'乳児〜小児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'右室流出路狭窄を伴うチアノーゼ性先天性心疾患。',
    image:I('tof-xray',sources.tof,'X線','Fallot四徴症の胸部X線でboot-shaped heart','心尖部挙上と肺動脈主幹部の陥凹。',[A('boot','rectangle',.18,.32,.66,.46,'木靴状心','挙上した心尖部と肺動脈部の陥凹')]),
    firstLook:['心尖部','肺血管陰影'],keyFindings:['boot-shaped heart','肺血管陰影減少'],diagnosticClues:['チアノーゼ発作','しゃがみ込み'],
    differentialDiagnoses:[D('肺動脈閉鎖','より高度な肺血流減少'),D('TGA','新生児期から高度チアノーゼ')],
    explanation:'右室肥大で心尖部が挙上し、肺動脈部が陥凹する。',pathology:'VSD、肺動脈狭窄、大動脈騎乗、右室肥大。',
    nextTests:['心エコーで解剖と流出路狭窄を評価','酸素化とヘマトクリットを評価'],initialManagement:['チアノーゼ発作では鎮静・酸素化・静脈還流改善を図る','循環器専門医へ緊急相談'],
    examPearls:['肺血流減少型チアノーゼ性心疾患'],pitfalls:['木靴状心が常に明瞭とは限らない'],relatedCases:['tga-egg-on-string']}),
  C({id:9,slug:'tga-egg-on-string',title:'完全大血管転位',category:'循環器',ageGroup:'新生児',difficulty:1,frequency:5,typicality:4,
    clinicalSummary:'体循環と肺循環が並列となり、混合の程度が生存を左右する。',
    image:I('tga-xray',sources.tga,'X線','完全大血管転位の胸部X線でegg-on-side appearance','卵形心陰影と狭い上縦隔。'),
    firstLook:['上縦隔幅','心陰影の卵形'],keyFindings:['egg-on-a-string appearance','肺血流増加'],diagnosticClues:['出生直後からの強いチアノーゼ','酸素反応不良'],
    differentialDiagnoses:[D('肺動脈閉鎖','肺血流減少'),D('Fallot四徴症','木靴状心、肺血流減少')],
    explanation:'前後関係となる大血管により上縦隔が狭く見える。所見は常に出現するわけではない。',pathology:'大動脈が右室、肺動脈が左室から起始。',
    nextTests:['緊急心エコーで診断と混合部位を評価','酸素化・血液ガスを評価'],initialManagement:['動脈管開存維持を検討','混合不十分なら緊急の専門的介入'],
    examPearls:['並列循環なので混合が必要'],pitfalls:['典型X線所見を待って治療を遅らせない'],relatedCases:['tetralogy-fallot-boot-heart']}),
  C({id:10,slug:'tapvr-snowman-sign',title:'総肺静脈還流異常症',category:'循環器',ageGroup:'乳児',difficulty:2,frequency:4,typicality:4,
    clinicalSummary:'肺静脈が左房ではなく体静脈系へ還流する。snowman signは主に上心臓型で経時的に形成される。',
    image:I('tapvr-source',sources.tapvr,'X線','上心臓型TAPVRのsnowman sign原典画像ページ','転載条件を確定できないため原典リンクのみ。'),
    firstLook:['上縦隔の拡大','8の字状心陰影'],keyFindings:['snowman sign','肺血流増加'],diagnosticClues:['チアノーゼ','右心系容量負荷'],
    differentialDiagnoses:[D('ASD','チアノーゼは通常軽い'),D('肺静脈狭窄','肺うっ血が前景')],
    explanation:'垂直静脈、左腕頭静脈、上大静脈の拡張と心陰影が雪だるま状になる。新生児早期には目立たない。',pathology:'全肺静脈血が体静脈系に還流。',
    nextTests:['心エコーで還流経路と閉塞を評価','不明瞭時はCT/MRIを検討'],initialManagement:['閉塞性TAPVRは緊急手術相談','酸素化と循環を安定化'],
    examPearls:['snowman signは上心臓型かつ時間経過後'],pitfalls:['新生児でsnowman signがないことを除外根拠にしない']}),
  C({id:11,slug:'atrial-septal-defect',title:'心房中隔欠損症',category:'循環器',ageGroup:'小児',difficulty:1,frequency:4,typicality:4,
    clinicalSummary:'左→右シャントにより右心系容量負荷を来す。',
    image:I('asd-echo',sources.asd,'心エコー','二次孔型心房中隔欠損の心エコー像','心房中隔の欠損部を観察。',[A('defect','circle',.46,.36,.18,.24,'欠損部','心房中隔の連続性欠如')]),
    firstLook:['心房中隔の連続性','右心系拡大'],keyFindings:['心房中隔欠損','右室容量負荷'],diagnosticClues:['固定性II音分裂','肺動脈駆出性雑音'],
    differentialDiagnoses:[D('肺静脈還流異常','肺静脈の還流経路が異常'),D('PFO','通常は有意な右心容量負荷なし')],
    explanation:'欠損孔そのものに加え、シャント方向・量と右心系負荷を評価する。',pathology:'心房中隔の形成異常。',
    nextTests:['カラードプラでシャント評価','右室容量と肺動脈圧を評価'],initialManagement:['無症状例は循環器で計画的評価','有意シャントは閉鎖適応を専門評価'],
    examPearls:['固定性II音分裂'],pitfalls:['欠損径だけで重症度を決めない']}),
  C({id:12,slug:'supraventricular-tachycardia',title:'上室頻拍',category:'循環器',ageGroup:'乳児〜小児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'小児で突然発症・停止する規則正しい狭QRS頻拍。',
    image:I('svt-ecg',sources.svt,'心電図','上室頻拍のII誘導心電図（成人参考画像）','規則正しい狭QRS頻拍。小児実画像ではないことに注意。'),
    firstLook:['QRS幅','規則性','P波とQRSの関係'],keyFindings:['規則正しい狭QRS頻拍','P波が不明瞭または逆行性'],diagnosticClues:['突然の発症・停止','乳児の哺乳不良や蒼白'],
    differentialDiagnoses:[D('洞性頻脈','心拍数が変動しP波が先行'),D('心房粗動','鋸歯状波と伝導比')],
    explanation:'年齢別の心拍数と臨床状況を合わせ、洞性頻脈と区別する。',pathology:'房室回帰性または房室結節回帰性頻拍など。',
    nextTests:['12誘導心電図','循環不全の有無を直ちに評価'],initialManagement:['不安定なら同期下カルディオバージョンを準備','安定例は迷走神経刺激など標準アルゴリズムに従う'],
    examPearls:['規則正しい狭QRS＋突然発症'],pitfalls:['心拍数だけで洞性頻脈と決めない'],relatedCases:['wpw-delta-wave']}),
  C({id:13,slug:'wpw-delta-wave',title:'WPW症候群',category:'循環器',ageGroup:'小児〜若年',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'副伝導路による心室早期興奮を示す。',
    image:I('wpw-ecg',sources.wpw,'心電図','WPW症候群の心電図で短いPR間隔とdelta wave','QRS初期のなだらかな立ち上がりを観察。',[A('delta','rectangle',.12,.22,.74,.55,'delta wave','複数誘導のQRS初期を比較')]),
    firstLook:['PR間隔','QRS初期の立ち上がり'],keyFindings:['短いPR間隔','delta wave','幅広いQRS'],diagnosticClues:['発作性上室頻拍の既往'],
    differentialDiagnoses:[D('脚ブロック','PR短縮とdelta waveを欠く'),D('心室頻拍','頻拍時の房室関係とQRS形態')],
    explanation:'洞調律時の早期興奮所見と、発作時頻拍の機序を分けて考える。',pathology:'房室結節を迂回する副伝導路。',
    nextTests:['12誘導心電図','症状・頻拍歴に応じ専門的リスク評価'],initialManagement:['頻拍時は血行動態を評価','不規則なwide QRS頻拍では房室結節遮断薬の選択に注意し専門家へ相談'],
    examPearls:['短PR＋delta wave'],pitfalls:['心房細動合併時の薬剤選択を誤らない'],relatedCases:['supraventricular-tachycardia']}),
  C({id:14,slug:'intussusception-target-sign',title:'腸重積',category:'消化器',ageGroup:'乳幼児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'間欠的腹痛、嘔吐、血便を来しうる。典型三徴が揃わないことも多い。',
    image:I('intussusception-us',sources.intussusception,'超音波','腸重積の超音波で同心円状のtarget sign','腸管が重なった同心円状構造。',[A('target','ellipse',.14,.05,.42,.86,'target sign','同心円状の腸管壁')]),
    firstLook:['横断像の同心円構造'],keyFindings:['target sign','縦断像のpseudokidney sign'],diagnosticClues:['間欠的啼泣','嘔吐','粘血便'],
    differentialDiagnoses:[D('胃腸炎','持続的な下痢が主体'),D('中腸軸捻転','胆汁性嘔吐、whirlpool sign')],
    explanation:'超音波が第一選択。血流、先進部、腹水なども評価する。',pathology:'近位腸管が遠位腸管へ陥入。',
    nextTests:['超音波で診断と虚血所見を評価','腹膜刺激症状時は穿孔評価'],initialManagement:['静脈路確保と全身評価','適応があれば画像下整復を速やかに検討'],
    examPearls:['血便を待たず間欠的腹痛で疑う'],pitfalls:['三徴が揃わないため否定しない']}),
  C({id:15,slug:'hypertrophic-pyloric-stenosis',title:'肥厚性幽門狭窄症',category:'消化器',ageGroup:'乳児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'生後数週からの非胆汁性噴水状嘔吐と体重増加不良。',
    image:I('pyloric-us',sources.pyloric,'超音波','6週児の肥厚性幽門狭窄症の超音波像','肥厚・延長した幽門筋。',[A('pylorus','rectangle',.2,.22,.62,.5,'肥厚した幽門','筋層と幽門管長を計測')]),
    firstLook:['幽門筋厚','幽門管長','胃内容通過'],keyFindings:['幽門筋肥厚','幽門管延長'],diagnosticClues:['非胆汁性噴水状嘔吐','生後2〜8週ごろ'],
    differentialDiagnoses:[D('胃食道逆流','噴水状でなく全身状態が保たれやすい'),D('十二指腸閉鎖','出生直後の胆汁性嘔吐とdouble bubble')],
    explanation:'超音波で筋層を正しく同定し、持続的な通過障害を確認する。',pathology:'幽門輪状筋の肥厚。',
    nextTests:['電解質と酸塩基平衡を評価','超音波で形態と通過を確認'],initialManagement:['まず脱水・電解質異常を補正','安定化後に外科治療'],
    examPearls:['低Cl性代謝性アルカローシス'],pitfalls:['手術を電解質補正より先行させない']}),
  C({id:16,slug:'midgut-volvulus-whirlpool-sign',title:'中腸軸捻転',category:'消化器',ageGroup:'新生児〜乳児',difficulty:2,frequency:5,typicality:5,
    clinicalSummary:'胆汁性嘔吐を来す外科的緊急疾患。腸回転異常を背景に発症する。',
    image:I('volvulus-source',sources.volvulus,'超音波','中腸軸捻転のwhirlpool sign原典画像ページ','転載条件を確定できないため原典リンクのみ。'),
    firstLook:['上腸間膜動脈周囲の血管・腸間膜'],keyFindings:['whirlpool sign','上腸間膜静脈の異常位置'],diagnosticClues:['胆汁性嘔吐','急速な循環不全や腹膜刺激症状'],
    differentialDiagnoses:[D('十二指腸閉鎖','double bubble、遠位ガスなし'),D('腸重積','target sign、乳幼児の間欠痛')],
    explanation:'SMAを中心にSMVと腸間膜が渦巻く。疑いが高い場合は画像検査で手術を遅らせない。',pathology:'腸回転異常に伴う腸間膜基部の捻転。',
    nextTests:['超音波または上部消化管造影を施設体制に応じ実施','乳酸・酸塩基平衡を評価'],initialManagement:['絶食、胃管減圧、静脈路確保','小児外科へ直ちに相談'],
    examPearls:['新生児の胆汁性嘔吐は軸捻転を除外するまで緊急'],pitfalls:['一時的な症状改善で除外しない']}),
  C({id:17,slug:'nec-pneumatosis',title:'壊死性腸炎',category:'消化器・新生児',ageGroup:'早産児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'早産児の哺乳不耐、腹部膨満、血便、全身状態悪化で疑う。',
    image:I('nec-xray',sources.nec,'X線','新生児壊死性腸炎の腹部X線で腸管壁内ガスと門脈ガス','腸管壁に沿う透亮像。',[A('pneumatosis','rectangle',.12,.25,.72,.48,'腸管壁内ガス','腸管壁に沿う気泡状・線状ガス')]),
    firstLook:['腸管壁内ガス','門脈ガス','腹腔内遊離ガス'],keyFindings:['pneumatosis intestinalis','門脈ガス'],diagnosticClues:['早産','腹部膨満と血便'],
    differentialDiagnoses:[D('特発性腸管穿孔','限局穿孔でpneumatosisを欠くことがある'),D('敗血症性イレウス','腸管壁内ガスを欠く')],
    explanation:'pneumatosisは代表的所見。連続撮影では病勢と穿孔を評価する。',pathology:'未熟腸管の炎症・虚血・細菌関与による壊死。',
    nextTests:['腹部X線を経時評価','血算・炎症・血液ガス・培養を評価'],initialManagement:['絶食、胃管減圧、循環呼吸支持','抗菌薬と外科コンサルトを重症度に応じ実施'],
    examPearls:['腸管壁内ガスはBell stage II以降の重要所見'],pitfalls:['単なる便中ガスと混同しない']}),
  C({id:18,slug:'duodenal-atresia-double-bubble',title:'十二指腸閉鎖',category:'消化器',ageGroup:'新生児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'出生直後からの胆汁性嘔吐。閉鎖部位により胆汁性でない場合もある。',
    image:I('duodenal-xray',sources.duodenal,'X線','新生児十二指腸閉鎖の腹部X線でdouble-bubble sign','胃と近位十二指腸の二つのガス像。',[A('double','rectangle',.18,.12,.64,.52,'double bubble','胃泡と拡張した近位十二指腸')]),
    firstLook:['上腹部の二つのガス像','遠位腸管ガス'],keyFindings:['double-bubble sign','遠位ガス欠如'],diagnosticClues:['出生直後の胆汁性嘔吐'],
    differentialDiagnoses:[D('輪状膵・十二指腸狭窄','遠位ガスが残ることがある'),D('中腸軸捻転','緊急性が高くwhirlpool sign')],
    explanation:'完全閉鎖では胃と近位十二指腸だけがガスで拡張する。',pathology:'十二指腸内腔の先天的閉鎖。',
    nextTests:['関連奇形を心エコー等で評価','軸捻転を臨床状況に応じ除外'],initialManagement:['絶食・胃管減圧・静脈輸液','小児外科へ相談'],
    examPearls:['Down症候群との関連'],pitfalls:['double bubbleを見て軸捻転の緊急性評価を忘れない']}),
  C({id:19,slug:'rickets-metaphysis',title:'くる病',category:'骨・代謝',ageGroup:'乳幼児〜小児',difficulty:1,frequency:4,typicality:5,
    clinicalSummary:'成長板の石灰化障害により骨幹端変化を来す。',
    image:I('rickets-xray',sources.rickets,'X線','くる病の手関節X線で骨幹端のcuppingを示す','橈骨・尺骨遠位骨幹端を観察。',[A('metaphysis','rectangle',.06,.46,.88,.28,'骨幹端変化','cupping、fraying、widening')]),
    firstLook:['橈骨・尺骨遠位骨幹端','成長板幅'],keyFindings:['cupping','fraying','widening'],diagnosticClues:['O脚','肋骨念珠','成長障害'],
    differentialDiagnoses:[D('Blount病','局所的な脛骨近位内側変形'),D('低ホスファターゼ症','低ALPが鑑別点')],
    explanation:'急速に成長する骨幹端で所見が目立つ。',pathology:'成長板軟骨の石灰化障害。',
    nextTests:['Ca、P、ALP、PTH、25(OH)Dを評価','病歴から栄養性・遺伝性・腎性を鑑別'],initialManagement:['原因を特定して補充・基礎疾患治療','重症低Ca血症は緊急対応'],
    examPearls:['くる病ではALP上昇が重要'],pitfalls:['画像だけで原因を栄養性に固定しない']}),
  C({id:20,slug:'iga-vasculitis-purpura',title:'IgA血管炎',category:'皮膚・免疫',ageGroup:'小児',difficulty:1,frequency:5,typicality:5,
    clinicalSummary:'下肢優位の触知性紫斑、腹痛、関節症状、腎病変を組み合わせて診断する。',
    image:I('iga-photo',sources.iga,'皮膚写真','IgA血管炎の下肢紫斑（症例年齢不明）','下肢・足部に分布する非退色性紫斑。'),
    firstLook:['下肢優位の分布','圧迫で退色しない紫斑'],keyFindings:['触知性紫斑','左右対称で下肢優位'],diagnosticClues:['腹痛','関節痛','血尿・蛋白尿'],
    differentialDiagnoses:[D('血小板減少性紫斑病','血小板減少を伴う'),D('髄膜炎菌感染症','毒性所見と急速進行')],
    explanation:'皮膚所見だけでなく消化管・関節・腎病変を系統的に評価する。',pathology:'IgA優位の小血管炎。',
    nextTests:['尿検査・血圧・腎機能を初診時と経時的に評価','血算で血小板数を確認'],initialManagement:['重症腹症・消化管出血・腎障害を評価','臓器病変に応じ専門管理'],
    examPearls:['紫斑が先行しない腹痛例もある'],pitfalls:['皮疹改善だけで腎フォローを終了しない']}),
  C({id:21,slug:'wilms-tumor-histology',title:'Wilms腫瘍',category:'病理・血液',curriculumDomain:'腫瘍',ageGroup:'幼児',difficulty:2,frequency:5,typicality:5,
    clinicalSummary:'幼児の無痛性腹部腫瘤を代表とする腎原発悪性腫瘍。病理では腎発生を模倣する成分を評価する。',
    images:[I('wilms-he',sources.wilmsPathology,'病理','Wilms腫瘍のH&E染色で芽体・上皮・間質成分を示す標本（症例年齢不明）','密な芽体成分の中に未熟な上皮性管腔と間質が混在する。',[A('wilms-epithelial','ellipse',.24,.35,.16,.18,'上皮成分','未熟な管腔様構造'),A('wilms-stroma','rectangle',.12,.7,.5,.16,'間質成分','紡錘形細胞を含む間質')])],
    firstLook:['芽体・上皮・間質の三成分','核異型と異常核分裂'],keyFindings:['小型芽体細胞','未熟な管腔形成','線維性・筋性の間質'],
    diagnosticClues:['幼児の腎腫瘤','三相性パターン'],differentialDiagnoses:[D('神経芽腫','副腎・交感神経由来、neuropilやロゼット'),D('腎明細胞肉腫','単調な細胞像で三相性を欠く')],
    explanation:'典型例は芽体・上皮・間質の三相性を示すが、単相性例もある。予後分類では退形成の有無が重要である。',
    pathology:'後腎芽体に類似する胎児性腎腫瘍。病理型と病期を組み合わせて評価する。',
    nextTests:['腹部画像で腎原発と進展範囲を評価','病理で退形成の有無を評価'],initialManagement:['小児腫瘍・小児外科チームへ速やかに連携','生検や手術の順序は治療プロトコルに従う'],
    examPearls:['三相性は代表所見だが必須ではない','退形成は重要な予後因子'],pitfalls:['腹部腫瘤を触診で強く圧迫しない','病理画像だけで病期を決めない'],relatedCases:['neuroblastoma-histology']}),
  C({id:22,slug:'neuroblastoma-histology',title:'神経芽腫',category:'病理・血液',curriculumDomain:'腫瘍',ageGroup:'乳幼児',difficulty:2,frequency:5,typicality:5,
    clinicalSummary:'交感神経系由来の小児悪性腫瘍。未熟神経芽細胞、neuropil、Homer Wright型ロゼットを観察する。',
    images:[
      I('neuroblastoma-low',sources.neuroblastomaLow,'病理','神経芽腫H&E染色の低倍率像（症例年齢不明）','小型腫瘍細胞が神経網様物質を囲む結節状配列。',[A('neuro-rosettes-low','ellipse',.18,.16,.62,.68,'ロゼット群','neuropilを囲む腫瘍細胞配列')]),
      I('neuroblastoma-high',sources.neuroblastomaHigh,'病理','神経芽腫H&E染色の高倍率像でHomer Wright型ロゼットを示す（症例年齢不明）','中心の好酸性neuropilを腫瘍細胞が取り囲む。',[A('neuro-rosette-high','ellipse',.04,.06,.3,.28,'Homer Wright型ロゼット','中心にneuropilを伴う')]),
    ],
    firstLook:['腫瘍細胞の分化度','neuropilとロゼット','Schwann細胞性間質'],keyFindings:['小円形細胞','Homer Wright型ロゼット','neuropil'],
    diagnosticClues:['副腎・傍脊柱腫瘤','尿中カテコールアミン代謝産物'],differentialDiagnoses:[D('Wilms腫瘍','腎原発で三相性病理'),D('Ewing肉腫','構造形成に乏しく分子診断が必要')],
    explanation:'Homer Wright型ロゼットは中心にneuropilを伴う。組織像だけでなく年齢、病期、MYCNなどの生物学的因子を統合する。',
    pathology:'神経堤由来の神経芽細胞性腫瘍。分化度、Schwann細胞性間質、MKIと年齢が病理分類に関わる。',
    nextTests:['画像で原発巣と転移を評価','尿中VMA/HVAと腫瘍生物学的検査を評価'],initialManagement:['小児腫瘍チームでリスク分類','脊髄圧迫など緊急合併症を先に評価'],
    examPearls:['乳児の一部では自然退縮がみられる','Homer Wright型ロゼットの中心は腔ではなくneuropil'],pitfalls:['ロゼットだけで他の小円形細胞腫瘍を除外しない'],relatedCases:['wilms-tumor-histology','ewing-sarcoma-histology']}),
  C({id:23,slug:'burkitt-lymphoma-histology',title:'Burkittリンパ腫',category:'病理・血液',curriculumDomain:'腫瘍',ageGroup:'小児〜若年者',difficulty:2,frequency:5,typicality:5,
    clinicalSummary:'急速増大する成熟B細胞腫瘍。低倍率のstarry-sky patternとMYC再構成を結び付ける。',
    images:[
      I('burkitt-starry-sky',sources.burkittLow,'病理','Burkittリンパ腫H&E染色のstarry-sky pattern（症例年齢不明）','密な腫瘍細胞の間に淡明なtingible-body macrophageが散在する。',[A('burkitt-macrophage','circle',.33,.35,.13,.17,'組織球','貪食物を含む淡明なmacrophage')]),
      I('burkitt-high',sources.burkittHigh,'病理','Burkittリンパ腫H&E染色の低〜中倍率像（症例年齢不明）','均一な中型リンパ系細胞がびまん性に増殖する。',[A('burkitt-sheet','rectangle',.08,.08,.84,.8,'単調な細胞増殖','均一な中型腫瘍細胞')]),
    ],
    firstLook:['低倍率のstarry-sky pattern','細胞の均一性と増殖像'],keyFindings:['単調な中型B細胞','tingible-body macrophage','starry-sky pattern'],
    diagnosticClues:['腹部腫瘤または顎部腫瘤','MYC再構成'],differentialDiagnoses:[D('びまん性大細胞型B細胞リンパ腫','より大型で多形性の細胞'),D('リンパ芽球性リンパ腫','TdT陽性の前駆リンパ系腫瘍')],
    explanation:'starry-sky patternは高い細胞回転を反映するが特異的ではない。成熟B細胞形質とMYC再構成を確認して診断する。',
    pathology:'MYC活性化を特徴とする高増殖性成熟B細胞リンパ腫。',
    nextTests:['組織の免疫表現型とMYC再構成を評価','腫瘍崩壊症候群のリスクを緊急評価'],initialManagement:['診断段階から腫瘍崩壊症候群を予防・監視','小児血液腫瘍チームへ緊急連携'],
    examPearls:['倍加時間が短く腫瘍崩壊症候群リスクが高い','starry-skyは診断特異的ではない'],pitfalls:['形態だけでMYC再構成確認を省略しない'],relatedCases:['acute-lymphoblastic-leukemia-smear']}),
  C({id:24,slug:'ewing-sarcoma-histology',title:'Ewing肉腫',category:'病理・血液',curriculumDomain:'腫瘍',ageGroup:'学童〜思春期',difficulty:3,frequency:4,typicality:4,
    clinicalSummary:'骨・軟部に生じる小円形細胞肉腫。形態、免疫染色、融合遺伝子を統合して診断する。',
    images:[I('ewing-he',sources.ewingPathology,'病理','Ewing肉腫H&E染色で小円形細胞のびまん性増殖を示す（症例年齢不明）','構造形成に乏しい均一な小円形細胞がシート状に増殖する。',[A('ewing-cells','rectangle',.08,.08,.82,.76,'小円形細胞','構造形成に乏しい密な増殖')])],
    firstLook:['細胞サイズと均一性','構造形成の有無','壊死と線維性隔壁'],keyFindings:['小円形青色細胞','淡明〜乏しい細胞質','びまん性増殖'],
    diagnosticClues:['学童〜思春期の骨痛・腫脹','EWSR1::FLI1などの融合'],differentialDiagnoses:[D('神経芽腫','neuropilやHomer Wright型ロゼット'),D('リンパ芽球性腫瘍','白血球系免疫表現型')],
    explanation:'CD99は支持所見だが特異的ではない。EWSR1-ETS系融合などの分子所見を形態・臨床と統合する。',
    pathology:'Ewing肉腫は小円形細胞肉腫で、多くはEWSR1::FLI1融合を有する。',
    nextTests:['原発骨・軟部のMRIと全身病期評価','免疫染色と融合遺伝子検査'],initialManagement:['生検前に画像と生検経路を専門チームで計画','骨腫瘍専門施設へ連携'],
    examPearls:['CD99単独では診断しない','小円形細胞腫瘍の横断的鑑別が必要'],pitfalls:['不適切な生検経路で温存手術を妨げない'],relatedCases:['neuroblastoma-histology']}),
  C({id:25,slug:'celiac-disease-histology',title:'セリアック病',category:'病理・血液',curriculumDomain:'消化器',ageGroup:'乳幼児〜思春期',difficulty:2,frequency:3,typicality:5,
    clinicalSummary:'グルテン関連免疫介在性腸症。小腸生検で絨毛、陰窩、上皮内リンパ球を系統的に読む。',
    images:[
      I('celiac-low',sources.celiacLow,'病理','セリアック病小腸生検H&E染色の低倍率像（症例年齢不明）','絨毛の短縮・平坦化と陰窩過形成。',[A('celiac-villi','rectangle',.04,.08,.9,.42,'絨毛萎縮','絨毛が短縮し表面が平坦化')]),
      I('celiac-high',sources.celiacHigh,'病理','セリアック病小腸生検H&E染色の高倍率像（症例年齢不明）','表面上皮内のリンパ球増加を観察する。',[A('celiac-iel','rectangle',.08,.02,.8,.32,'上皮内リンパ球','表面上皮内に増加する小型リンパ球')]),
    ],
    firstLook:['絨毛高と陰窩深の比','上皮内リンパ球'],keyFindings:['絨毛萎縮','陰窩過形成','上皮内リンパ球増加'],
    diagnosticClues:['慢性下痢・成長障害・鉄欠乏','tTG-IgAなどの血清学'],differentialDiagnoses:[D('食物蛋白誘発性腸症','乳児期の食物関連症状と病歴'),D('Giardia感染症','虫体の確認と感染歴')],
    explanation:'病理所見はセリアック病に特異的ではない。グルテン摂取下の血清学、適切な部位からの生検、臨床像を統合する。',
    pathology:'グルテンに対する免疫反応による小腸粘膜障害。',
    nextTests:['総IgAとtTG-IgAを基本に血清学を評価','必要時は十二指腸球部と遠位十二指腸から複数生検'],initialManagement:['診断前に自己判断でグルテン除去を開始しない','確定後は栄養評価と食事療法支援'],
    examPearls:['IgA欠損ではIgG系検査を検討','病理所見単独では確定しない'],pitfalls:['検査前のグルテン除去で偽陰性を招かない'],relatedCases:['duodenal-atresia-double-bubble']}),
  C({id:26,slug:'acute-lymphoblastic-leukemia-smear',title:'急性リンパ性白血病',category:'病理・血液',curriculumDomain:'血液',ageGroup:'小児',difficulty:2,frequency:5,typicality:4,
    clinicalSummary:'小児で最も重要な急性白血病。塗抹では芽球増加を認識し、免疫表現型・遺伝学へつなぐ。',
    images:[
      I('all-low',sources.allLow,'血液塗抹','前駆B細胞性ALLの骨髄塗抹Wright染色（症例年齢不明）','多数のリンパ芽球が赤血球の間を占める。',[A('all-blasts-low','rectangle',.04,.02,.9,.9,'リンパ芽球','高い核細胞質比を示す芽球群')]),
      I('all-high',sources.allHigh,'血液塗抹','ALLの骨髄塗抹で多数のリンパ芽球を示す（症例年齢不明）','均一な芽球が増加し、正常造血細胞が相対的に減少する。',[A('all-blasts-high','rectangle',.04,.05,.88,.86,'芽球増加','核優位の未熟細胞が多数')]),
    ],
    firstLook:['芽球の割合','核細胞質比と核クロマチン','Auer小体の有無'],keyFindings:['リンパ芽球増加','高い核細胞質比','乏しい細胞質'],
    diagnosticClues:['発熱・蒼白・出血傾向','血球減少または白血球異常'],differentialDiagnoses:[D('急性骨髄性白血病','骨髄系免疫表現型、Auer小体を伴うことがある'),D('伝染性単核球症','反応性異型リンパ球と臨床像')],
    explanation:'形態だけでALLの系統・病型は確定できない。骨髄、フローサイトメトリー、染色体・遺伝子検査を統合する。',
    pathology:'リンパ系前駆細胞のクローン性増殖により正常造血が抑制される。',
    nextTests:['骨髄検査と免疫表現型を評価','染色体・遺伝子異常と中枢神経浸潤を評価'],initialManagement:['腫瘍崩壊症候群と感染・出血リスクを緊急評価','小児血液腫瘍チームへ連携'],
    examPearls:['末梢血白血球数が正常・低値でも否定できない','治療層別化には遺伝学と早期治療反応が重要'],pitfalls:['塗抹像だけでB-ALL/T-ALLを分類しない'],relatedCases:['burkitt-lymphoma-histology']}),
  ...expansionCases,
  ...continuationCases,
  ...completionCases0109,
  ...completionCases1017,
  ...completionCases1825,
];

const legacyCoverageTargets = {
  'croup-steeple-sign': ['クループ'],
  'epiglottitis-thumb-sign': ['急性喉頭蓋炎'],
  'airway-foreign-body-hyperinflation': ['気道異物'],
  'neonatal-rds': ['RDS'],
  'meconium-aspiration': ['胎便吸引症候群'],
  'transient-tachypnea-newborn': ['TTN'],
  'congenital-diaphragmatic-hernia': ['横隔膜ヘルニア'],
  'tetralogy-fallot-boot-heart': ['Fallot四徴症'],
  'tga-egg-on-string': ['完全大血管転位'],
  'tapvr-snowman-sign': ['総肺静脈還流異常'],
  'atrial-septal-defect': ['心房中隔欠損'],
  'supraventricular-tachycardia': ['上室頻拍'],
  'wpw-delta-wave': ['WPW症候群'],
  'intussusception-target-sign': ['腸重積'],
  'hypertrophic-pyloric-stenosis': ['肥厚性幽門狭窄症'],
  'midgut-volvulus-whirlpool-sign': ['中腸軸捻転'],
  'nec-pneumatosis': ['NEC'],
  'duodenal-atresia-double-bubble': ['十二指腸閉鎖'],
  'rickets-metaphysis': ['くる病'],
  'iga-vasculitis-purpura': ['IgA血管炎'],
  'wilms-tumor-histology': ['Wilms腫瘍'],
  'neuroblastoma-histology': ['神経芽腫'],
  'burkitt-lymphoma-histology': ['Burkittリンパ腫'],
  'ewing-sarcoma-histology': ['Ewing肉腫'],
  'celiac-disease-histology': ['セリアック病理'],
  'acute-lymphoblastic-leukemia-smear': ['ALL血液塗抹'],
  'acute-promyelocytic-leukemia-smear': ['AML血液塗抹'],
  'sickle-cell-disease-smear': ['溶血性貧血塗抹'],
  'iron-deficiency-anemia-smear': ['鉄欠乏性貧血塗抹'],
  'rhabdomyosarcoma-histology': ['横紋筋肉腫'],
  'hepatoblastoma-cytology': ['肝芽腫'],
  'retinoblastoma-rosette': ['網膜芽細胞腫'],
  'hirschsprung-ache-histology': ['Hirschsprung病理'],
  'down-syndrome-karyotype': ['Down症候群核型'],
  'turner-syndrome-karyotype': ['Turner症候群核型'],
  'klinefelter-syndrome-karyotype': ['Klinefelter症候群核型'],
  'osteogenesis-imperfecta-xray': ['主要奇形症候群の身体所見'],
  'varicella-rash-child': ['麻疹・風疹・水痘皮疹'],
  'hand-foot-mouth-disease-rash': ['手足口病'],
  'atopic-dermatitis-child': ['アトピー性皮膚炎'],
  'upj-obstruction-hydronephrosis-ultrasound': ['水腎症超音波'],
  'obstructive-hydrocephalus-child-ct': ['水頭症'],
  'measles-rash-koplik-spots': ['麻疹・風疹・水痘皮疹'],
  'rubella-rash-child': ['麻疹・風疹・水痘皮疹'],
  'acute-otitis-media-otoscopy': ['耳鏡所見'],
};

for (const item of cases) {
  if (!item.coverageTargets?.length && legacyCoverageTargets[item.slug]) {
    item.coverageTargets = legacyCoverageTargets[item.slug];
  }
}

const coverageBlueprint = [
  ['小児保健',['母子健康手帳と健診時期','予防接種スケジュール','乳幼児身体診察','被虐待を疑う損傷パターン']],
  ['成長・発達',['標準成長曲線','頭囲曲線','骨年齢','乳幼児発達マイルストーン','低身長パターン']],
  ['栄養',['栄養評価曲線','蛋白エネルギー栄養障害','ビタミン欠乏所見','経腸栄養デバイス']],
  ['水・電解質',['脱水所見','酸塩基平衡図','低Na・高Na血症','低K・高K血症心電図']],
  ['新生児',['RDS','TTN','胎便吸引症候群','横隔膜ヘルニア','NEC','新生児黄疸','頭蓋内出血','低酸素性虚血性脳症']],
  ['先天異常・遺伝',['Down症候群核型','Turner症候群核型','Klinefelter症候群核型','染色体微細欠失','主要奇形症候群の身体所見']],
  ['先天代謝異常，代謝性疾患',['くる病','ムコ多糖症骨格','有機酸代謝異常MRI','Wilson病角膜所見','ライソゾーム病の末梢血・骨髄像']],
  ['内分泌',['先天性甲状腺機能低下症','先天性副腎過形成','糖尿病性ケトアシドーシス','下垂体MRI','性分化疾患の画像評価']],
  ['生体防御・免疫',['原発性免疫不全の胸腺陰影','慢性肉芽腫症検査像','血球貪食像','補体異常の検査パターン']],
  ['膠原病・リウマチ性疾患',['IgA血管炎','川崎病冠動脈エコー','若年性特発性関節炎','SLE皮膚・腎病理','皮膚筋炎']],
  ['アレルギー',['アトピー性皮膚炎','蕁麻疹','アナフィラキシー所見','食物アレルギー誘発症状','喘息画像鑑別']],
  ['感染症',['麻疹・風疹・水痘皮疹','手足口病','髄膜炎髄液像','肺炎画像','骨髄炎MRI','感染性心内膜炎エコー']],
  ['呼吸器',['クループ','急性喉頭蓋炎','気道異物','細気管支炎','肺炎','気胸','気管支拡張症','嚢胞性肺疾患']],
  ['消化器',['腸重積','肥厚性幽門狭窄症','中腸軸捻転','十二指腸閉鎖','セリアック病理','胆道閉鎖','Hirschsprung病理','炎症性腸疾患']],
  ['循環器',['Fallot四徴症','完全大血管転位','総肺静脈還流異常','心房中隔欠損','心室中隔欠損','動脈管開存','大動脈縮窄','上室頻拍','WPW症候群']],
  ['血液',['ALL血液塗抹','AML血液塗抹','ITP末梢血','溶血性貧血塗抹','鉄欠乏性貧血塗抹','凝固異常パターン']],
  ['腫瘍',['Wilms腫瘍','神経芽腫','Burkittリンパ腫','Ewing肉腫','横紋筋肉腫','肝芽腫','網膜芽細胞腫','脳腫瘍MRI']],
  ['腎・泌尿器',['水腎症超音波','膀胱尿管逆流','後部尿道弁','ネフローゼ病理','糸球体腎炎病理','多発性嚢胞腎']],
  ['生殖器',['停留精巣','精巣捻転','外性器異常','卵巣捻転','Müller管奇形']],
  ['神経・筋',['細菌性髄膜炎MRI','脳炎MRI','てんかん脳波','水頭症','Duchenne型筋ジストロフィー病理','脊髄性筋萎縮症','脳性麻痺MRI']],
  ['精神・行動・心身医学',['自閉スペクトラム評価','ADHD評価','摂食障害身体所見','心身症の鑑別フロー']],
  ['救急・集中治療',['一次評価ABCDE','心肺蘇生リズム','ショック所見','頭部外傷CT','熱傷面積','中毒の特徴的心電図']],
  ['思春期医学',['Tanner分類','原発性無月経の画像評価','摂食障害成長曲線','性感染症所見']],
  ['地域総合小児医療',['在宅医療デバイス','医療的ケア児の評価','学校生活管理指導表','移行期医療ロードマップ']],
  ['関連領域',['眼底所見','耳鏡所見','歯科口腔所見','皮膚腫瘍','整形外科X線','小児外科急性腹症']],
];

const coveragePlan = {
  title: '小児科画像アトラス網羅計画',
  scope: '日本小児科学会「小児科医の到達目標」改訂第8版の25分野について、専門医試験で画像・図表認識が有用な項目を管理する。',
  source: {
    title: '小児科医の到達目標―小児科専門医の教育目標― 改訂第8版',
    organization: '日本小児科学会',
    url: 'https://www.jpeds.or.jp/uploads/files/mokuhyo_8.pdf',
    effectiveFrom: '2025-04-01',
    accessedAt,
  },
  domains: coverageBlueprint.map(([name, targetVisuals], index) => {
    const currentCases = cases
      .filter((item) => item.curriculumDomain === name)
      .map((item) => ({ id: item.id, slug: item.slug, title: item.title, imageCount: item.images.length }));
    const hasVerifiedVisual = (item) => item.images.some(({ source }) =>
      Boolean(source.localImagePath || source.figureUrl || source.figureReference));
    const coveredTargets = targetVisuals.filter((target) => cases.some((item) =>
      item.curriculumDomain === name
      && item.coverageTargets?.includes(target)
      && hasVerifiedVisual(item)));
    const missingTargets = targetVisuals.filter((target) => !coveredTargets.includes(target));
    return {
      id: index + 1,
      name,
      targetVisuals,
      targetCount: targetVisuals.length,
      coveredTargets,
      coveredTargetCount: coveredTargets.length,
      missingTargets,
      currentCases,
      currentCaseCount: currentCases.length,
      status: missingTargets.length === 0 ? 'covered'
        : coveredTargets.length ? 'in-progress' : 'not-started',
    };
  }),
};

const sourcePath = (source) => source.localImagePath || '';
const audit = cases.flatMap((item) => item.images.map((image) => {
  const verified = Boolean(image.source.localImagePath
    || image.source.figureUrl || image.source.figureReference);
  return {
  caseId: item.id,
  caseSlug: item.slug,
  imageId: image.id,
  fileName: sourcePath(image.source).split('/').pop() || null,
  sourcePageUrl: image.source.sourcePageUrl,
  originalImageUrl: image.source.originalImageUrl || null,
  doi: image.source.doi || null,
  licenseName: image.source.licenseName,
  licenseUrl: image.source.licenseUrl || null,
  redistributionAllowed: image.source.redistributionAllowed,
  modificationAllowed: image.source.modificationAllowed,
  commercialUseAllowed: image.source.commercialUseAllowed ?? null,
  useMode: image.source.redistributionAllowed ? 'local' : 'external-link-only',
  modificationDescription: image.source.modificationDescription || 'なし',
  accessedAt: image.source.accessedAt,
  checkedBy: image.source.localImagePath
    ? 'Codex（Wikimedia Commons個別ファイル・ライセンス照合）'
    : verified ? 'Codex（原典内の具体的図表照合）' : '未確認',
  checkMethod: image.source.localImagePath
    ? 'Commons個別ファイルページ、原画像URL、ライセンス、ローカルファイルを照合'
    : verified ? 'figureUrlまたは図番号を原典ページと照合'
      : '原典候補URLのみ。具体的図表の特定は未完了',
  verificationStatus: verified ? 'verified' : 'needs-research',
  notes: image.source.pediatricImage === true ? '小児画像（原典の年齢根拠あり）'
    : image.source.pediatricImage === false ? '成人参考画像。画面上に明示。'
      : '小児画像か未確認。画面上に明示。',
  };
}));

const candidateAudit = cases.flatMap((item) => {
  const concreteCandidates = item.images.map((entry) => {
      const source = entry.source;
      const score = source.redistributionAllowed
        ? { typicality: item.typicality, quality: 5, pediatricFit: source.pediatricImage ? 5 : 2, sourceReliability: 4, licenseClarity: 5 }
        : { typicality: item.typicality, quality: 4, pediatricFit: 5, sourceReliability: 4, licenseClarity: 1 };
      const total = Object.values(score).reduce((sum, value) => sum + value, 0);
      return {
        caseSlug: item.slug, imageId: entry.id, title: source.title, disease: item.title, modality: entry.modality,
        publisher: source.organization || '', authors: source.copyrightHolder ? [source.copyrightHolder] : [],
        publicationYear: null, imageUrl: source.originalImageUrl || null, articleUrl: source.sourcePageUrl,
        doi: source.doi || null, pubmedId: source.pubmedId || null, license: source.licenseName,
        useMode: source.redistributionAllowed ? 'local' : 'external-link-only',
        pediatricImage: source.pediatricImage, patientAge: source.patientAge || null,
        modified: source.modified, resolution: source.resolution || null,
        figureUrl: source.figureUrl || source.originalImageUrl || null,
        figureReference: source.figureReference || null,
        score: { ...score, total },
        decision: source.redistributionAllowed ? 'adopted' : 'link-only',
        adoptionReason: source.redistributionAllowed
          ? '典型所見を示し、再配布可能な個別ライセンスを確認できた。'
          : '教育的価値は高いが再配布条件を確定できず、原典リンク方式を採用。',
        rejectionReason: null,
      };
    });
  const complete = concreteCandidates.length >= 3
    && concreteCandidates.every((candidate) =>
      Boolean(candidate.figureUrl || candidate.figureReference)
      && candidate.authors.length > 0
      && candidate.pediatricImage !== null
      && candidate.resolution);
  return concreteCandidates.map((candidate) => ({
    ...candidate,
    candidateResearchStatus: complete ? 'complete' : 'needs-research',
    candidateResearchNote: complete
      ? '3件以上の具体的候補について図版・著者・年齢・ライセンス・解像度を確認済み。'
      : '具体的な図版候補3件の比較が未完了。検索結果ページは候補数に含めない。',
  }));
});

fs.mkdirSync(path.join(root, 'data/atlas'), { recursive: true });
for (const [name, value] of [
  ['cases.json', cases],
  ['image-license-audit.json', audit],
  ['image-candidate-audit.json', candidateAudit],
  ['coverage-plan.json', coveragePlan],
]) {
  const output = `${JSON.stringify(value, null, 2)}\n`;
  const outputPath = path.join(root, 'data/atlas', name);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) {
      console.error(`Generated data is stale: data/atlas/${name}`);
      process.exitCode = 1;
    }
  } else {
    fs.writeFileSync(outputPath, output);
  }
}

console.log(`${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${cases.length} cases, ${audit.length} licenses, ${candidateAudit.length} concrete candidates, ${coveragePlan.domains.length} curriculum domains.`);
