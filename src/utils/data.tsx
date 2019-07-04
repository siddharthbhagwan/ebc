import * as GeoJsonData from "./geoJson";

const lukla_to_phakding =
  "co~gDk}ipOYm@OWCOGOe@m@k@e@u@mAeAwBUW_@AICw@i@KKGOQIKGEIEEGEWOUOGEGCELIZU^kAtAg@l@{@n@SDeCb@GHCHEDk@Lo@BG?KACDOZETKLi@Zq@N]BEAEOGII?ONKHE@KCKIGUCGMGUCEEMYGKM@[d@c@l@ITALCZOX?TIJGPk@j@kAp@YJS@IDMVELcAl@EZYZKFmALSLCLIZYNe@AIDEJEb@CRBJCLw@d@IFU`@K\\W\\_@b@OX{@dAGJAXGLC`@Ud@IDs@A]Pc@^MXCNg@d@WPQb@SX[V[^MVIb@ENa@V_@VQT]Vo@h@KPc@Rg@dAm@f@c@PKNQHGTi@`@a@b@k@l@INS^I^Bp@KZFXJVCTEf@GFEBJPOn@YTw@@y@OYQOBGD]KgAc@a@a@_@Um@}@W]Fe@R}@@m@y@I[TKP?XQTk@h@c@XOXa@zA[bAIN[d@k@d@k@b@_ApAS?i@WSPSPk@Ag@YONUIU@MTK`@Ab@c@Lq@?}Bz@e@f@o@bAw@j@UH{@Ck@\\c@PMKY?gAVo@FUNeACONEHDTKRUBg@VeA\\oC_@aJkAiEQgB}@mAk@SCcCUEIYe@Ru@Y}@[C[SKCo@A]?KBGHEb@@b@Hd@Nb@Jf@@RDZP\\LJ@LQxAGVg@DSAq@K}@QsBq@gBm@}AQo@NSPe@CaAL{@Hs@IaA@kBCYAk@Ow@U[C]CU@YGKEEMo@J]DUCSJ}@NOA[C[HOHSAMBe@?WHe@BOGKMQ@_@LONQFUPEHINI@QNOFIEIFGCGBKCWEEGk@PW^Q?WFe@?{@VOBKJEJQ@U?c@BSIw@g@MCOIi@Dg@EiBXk@D]Ng@Dk@Jk@VyDhAsAE_H`Dy@l@mAI}Bj@MC_@M[DyD_BgAAkB`Ao@PY@O?s@U{@s@}Bm@q@i@GQMIQPIT";

const phakding_to_namache_bazaar =
  "c_ihD}`gpOELoAi@q@Yk@?s@SyAMsEaCcAKe@Ik@lES`@OHg@Lm@GqA?a@JWIWKc@?q@@]Pe@n@QDKL[@q@NeBO{@AgAWcAa@m@c@]@k@Pa@@{@^g@d@QBcA\\a@Ta@X]\\k@\\{Af@{BpAa@x@APc@dEKPa@IIg@]YNw@Sa@g@iA]Fc@HKRWBo@UsBHsF_@aD~@cAf@aAZkCIMKYQ_C^eImBmBc@sA{BsEsH@Sf@MLK@q@?i@oAEY_ASkAEsA^[PFP?JQFm@HQCg@^OJULu@Ec@Uk@c@Qa@e@Cu@M]Y[{AoAe@G][m@sA[KQqAmA}D]_Ai@Wm@I`@{DkAoA{HmIgAiAc@?eARq@J_@?gBLu@D[LwA?UA}@_AWMg@c@]Io@CIYQEITMNe@FsARe@NOBGNIJ_@P[NGJSXQHWP[D_@CY?g@Wu@G[BQDOASCUROHYDYRMTy@l@wAr@eAXaHGWAg@Fc@P_AxB[`@C@q@[UMMAKMBOOSiAw@wBa@mASYBUDe@RGPAZDfAw@tAwCnA}C`AwDV}JjCiAX]@a@@s@USJWb@k@b@{BJi@TQBa@Fc@EyBa@[CcAj@KFM@YKwC_Be@QsB_@{@BAOOMe@CKDGHKfFCTGLe@f@KAKDMZSTONSCa@b@ABEC?S@a@CCE?ONS\\ADC?AW?GCAEBKr@Cp@@b@F\\JRAJIH[^O^c@j@OHc@NeAVmAP[BGAEGIUOKoCZiEpBoAjAWXQf@I^C`@Fh@?NCLKNg@`@e@j@c@t@O`@QLo@~@Q^KJ_@FOH]b@i@pAIFYDOEc@SSI{AAQBOZEf@GLkAb@SDSGIDCJGd@QPa@JQ?mAMkD{Ay@_@OEe@EUD]LYH_@Di@NY\\GLANDLE\\GRIHEN?FLT@H?DGHe@LK?_@KqBm@S?MCs@Wi@KYTG@ADI?KMEAE?IHIAOEMEDi@@CFC~@a@FC?QEUBERAXN\\FN?DCBO@MAKKMMUy@iBYkAIeAS]QKMEB?IKW_@WIaAQE@M?KCGEGHKBGAGGKCKCIIKACEC@G@CIEAKEG?GDOHQHKDK?QGKQKMOAUCMMCC";

const namache_bazaar_to_tyengboche =
  "m`vhDuggpOS@SBKAMIKK[Ai@Mq@QUASKGGGAWAyAOe@M{AWYG]u@s@_BO[AKDk@?UI]EK[Wa@EMACEA_@CS[YMEII?SCIMG_@Oc@]GKc@Ca@KUOQMa@AKGKYCgAFUMg@EOGKa@O[EIICM]My@G[KUU[i@[k@GYAa@a@s@CQ@WJ_@?ICGe@_@c@k@Sa@a@UKKIOGOIM[a@W]gAmA]q@Io@Gu@Kg@GMIESEMKGKQEKBSFSC]I[M_AP{@@KEk@_A]B}@]WCs@DsAF_D~@{AZIFKR]^kAPsANe@Au@Oq@Ai@DsBGM@IFQZETCXCPCVMRG@KASJUL_@q@KUC]Ok@?a@Ce@CYIQWq@c@m@IYCOSa@MSES@OHM?OCQ@Y^u@?]E]MUAc@@ODMIq@AYDu@?a@Ee@K}AGw@BYHq@X_@JMXu@X}@La@@g@Km@JYVUf@q@\\o@Po@?GGGM?KCM]A_@F[?w@SJIPQf@ET_@|@i@h@M?KHUdAcAtAYPUDYSGEe@Ba@gEQO[c@Gs@s@{@a@UMa@J[NQ^m@DMIWOy@P_@?OOU\\c@PSASPGDYTc@Fa@Kg@KSWQk@_@Wg@GUL}BSw@E_@Ce@w@K][o@KQC_@ScCOQO[Im@BK?IWBUFe@Qo@]gBGk@@OFg@E[I?C?g@r@MPOCKk@Ou@Bm@Ro@Dm@?IWIa@Ms@p@e@LU_@[{@a@[?EH]OUOShB}CVc@Ga@s@eFNc@Ww@yA}@Uo@Ci@Y_@Wm@Wy@Wq@Ec@c@q@Ss@_AGeAa@[Wy@Ws@SOOHSb@g@rAiA^m@EQa@]k@EcA_@Sc@Q_@PkATw@HeAAkAUo@[Ui@Iq@_CO{B_@{@]o@IAILIBEAO_A_@}AImCAq@AEEAGBCb@ADECIeBSFGBAm@AEMFE?CGAkAMWw@k@BwBEgAM@k@v@GFIA?o@AIE@GLE?CEAGMoF?MX{BAULuAKg@TqCTeD@m@_@eAZCHUPwAY]WoAZmA\\i@[o@?qBGa@Ug@Va@DUN}@ZUEk@EKGIaAHaAB[[QWeAm@^_AHC`@_AAEAIa@s@UM";

const tyenboche_to_dingboche =
  "kv{hDyfqpOCYa@cAs@aBc@Yc@Ea@_AiBoKcAmAy@OiAaAOWOUIqAEmAwAaAYg@WgBMa@e@e@a@Ag@Im@aAkBmBa@{@Uq@q@q@WYGo@cAyAm@aAa@i@aA_@k@g@YwAu@eEeAcAoDmCWAi@WaAa@cBu@_Bo@qAw@_Ba@W?UFIAu@c@]Go@@a@Iw@OcB{@aAk@_@Aw@La@M{@NGs@u@gBGo@Qu@k@eAB[MQIIGc@Ms@Cw@L_AQs@Ak@Uc@FO@a@aAaAoAiBG_@?M]QBG}@YaAIc@K{@y@g@m@c@[@U^]n@a@AWOGYS_@KWYYI]UaBm@_CEs@a@m@e@}@R]`@IJKW^m@BOEWWg@g@k@m@_@{@cA{@_BBKGMDOHg@Be@Fg@TYj@W^e@j@_@Ie@Mk@SYCq@U]ICu@iBG_@UMWQS@UOs@Iu@IS@CIHUEOQGu@AgAJ_@@i@E[BG?AIFODa@IUJ[r@_Ap@_@PU@Mq@kAa@YSe@m@o@_@WGMWEW_@SGOYWK}@e@O]WMI]Iq@Gy@IS[Ia@M[]UI?Mo@w@Ea@m@e@QUHs@Kc@MAKAEIFODKCOa@OKc@Qa@a@w@g@_@KGCSEa@_@e@i@OUe@_@c@SgAq@qAg@_@w@Yw@AAOB[e@QBi@]W_@QYYc@]m@Sc@SKc@Q_@MCY[Si@YMAGSSa@m@[M?SCQ[c@G_@BQMYEWUQgAsA@IFMMOW_@Ge@ZgAGW[OPYF]IQMI?UE_@WQWEHSJWEGFa@@SAq@QKAQBKGO_@i@ESC_ABe@Mw@IUCe@Ms@q@cAM[OIQu@BSi@]aAy@FWu@m@YUMBWMYScAg@We@{@[[IMWcAk@qAw@SMeAOw@UaA?mAHc@H]CO@c@?q@MOM_@Ds@@o@UiAe@QS]BKMa@Cc@HSQUA}@g@_@g@u@CASOWQIe@@m@[YEY?g@NWFe@XSFSBIEMEYMk@c@{@}@g@{@S[e@MCGWU[WGk@GU?UEYe@o@GM?W?_@IYO_@[W?U@k@]IICCMB_@p@_@RG@QOw@w@eBa@kA]m@]w@YkAO[KOA]U}@Bm@AYD]CSKSQ_AO[QM}@KqA[_@U]Og@M][w@e@_@i@a@Y_@GYYo@yAKOCYKk@Y_@Mi@a@c@[M_@Yw@k@s@SOIYU[S[]g@_@g@KQAk@Wa@Ua@Mg@Ia@BKDMCQYcAa@k@Mg@g@a@QyAyAmAyAkAy@qAaAk@s@OSWK[[Sk@Y_@e@UmByAc@O_@[S[W[GYEa@Q[EE";

const dingboche_to_chukung =
  "_yfiDub~pOy@k@QGg@WaA{@W[a@QSYOYeAgBeDkEc@y@KYcAoEg@iCQy@]w@K[?WDe@De@ESa@{@Sq@Ou@Ce@Gy@Ce@HaATyA@a@EYw@aCSo@Ik@Gq@BaAAgAIa@OSEU?WH[Jw@N{@H}AA[?g@Hi@T_BDw@@mA@e@?iCOuBc@cB[w@Sm@Ee@MqAsAgI[uA[}@]yAAi@DYDg@EW]KGGsAqC_AkBm@eAg@aAOS]w@WUS[CWEyAEYM_BAoAS_BAe@B_@Lg@Be@@kA?OOk@_@k@i@sB[aA?_@?YNYRON[BW?SAk@BSPg@B[GK?a@CcAg@uAQYGECM@SGQCKIGI_@GcBEk@Qi@e@{ASe@IUMKCYOu@Gm@Du@Bs@GYOWKUE_@?q@Ok@]}@QgAOk@c@e@Wi@[c@K[IQ@YCY]o@[U_@sAEUCe@EYo@iBQaAD]@a@KeA@i@J_@Jq@Ce@CUKS_@YMK";

const lobuche_to_dzongla =
  "qvqiDsazpOHBD?LBJ?jFoAd@Gn@BdCHd@AZBLDvEtATHl@Rb@\\nA`@`Bh@h@\\nBx@^HpCzAfCjAtBp@B@nBd@hFt@`@JxBl@lCnAjAh@NJBBNLHLrFhJvCdEDJBJDFLHD@DDZd@FLFHJJPLBFDFDDFBHBFBLTJDL@RHFBPDHDRJLPFTDPBPDNBLDHBDDBNLf@Vj@V^Rt@ZVJLBj@PFDBDDBZJ@?jAPv@R`@FH@B?N@D@F@HDJBJ?V@^BbB^RB`ANtAJ~ADd@?fAFzBJl@@V@ZHXHPFNDHFDD@@@@BH@BBL@L?V?V?BD\\Lb@DJBH?P@D?H?TAh@W|Am@zACDmAtDe@pAMNMLERYd@i@`AABa@~AYx@CFCB?F?D?HAPCLCNGLGVAHCJ@N?PDNAF@D@FAFGRIv@Ih@Ux@CLELKHG@I@QEECIC[CS@[Fa@Lo@HM?ICGCGAA?SHWHCDEHKJWJODODGJGFK@A@IHKPGXANAXEZIVGVAR?RDP@NDRLTH\\@bAAb@CZIb@Od@GXCf@Eh@O~@?@_@`AA@m@^a@PUL[XSRQRiB~BUXm@jBOr@a@~@A@g@n@GFa@h@QL]V{@f@a@VORONUHGBm@JiAK}@KsBZK@i@@WEUBOJCB[^OVCF[t@St@WNc@T_@HYd@e@d@i@TQZEDKLm@p@OVQXMv@Kz@Gp@CT[h@Wj@w@z@CNCL?@?P@H?HAj@BT@F@@?BABA@I^YnAGJMHCBGRANDRFNJNLFBB@B?B?HGf@ENwA~DsArEAF?d@Nj@LTpB~C";

const dayWiseDataP: any = {
  "1": lukla_to_phakding,
  "2": phakding_to_namache_bazaar,
  "4": namache_bazaar_to_tyengboche,
  "5": tyenboche_to_dingboche,
  "6": dingboche_to_chukung,
  "13": lobuche_to_dzongla
};

const getDayWiseDataP = () => dayWiseDataP;

const dayWiseDataG: any = {
  "7": GeoJsonData.chhukung_to_chhukung_ri_to_chhukung,
  "8": GeoJsonData.chhukung_to_kongma_la_to_lobuche,
  "10": GeoJsonData.lobuche_to_ebc_to_gorak_shep,
  "12": GeoJsonData.gorak_shep_to_kala_patthar_to_lobuche,
  "14": GeoJsonData.dzongla_to_thangnak,
  "15": GeoJsonData.thangnak_to_gokyo,
  "16": GeoJsonData.gokyo_to_gokyo_ri,
  "18": GeoJsonData.gokyo_to_marulung,
  "19": GeoJsonData.marulung_to_namche_bazaar
};

const getDayWiseDataG = () => dayWiseDataG;

const halts = [
  [27.74004, 86.712555], // Phakding
  [27.8069, 86.714], // Namche Bazaar
  [27.8362, 86.7646], // Tengboche
  [27.8923, 86.8314], // Dingboche
  [27.9045, 86.8713], // Chhukung
  [27.9485, 86.8104], // Lobuche
  [27.9809, 86.8285], // Gorak Shep
  [27.9397, 86.7733], // Dzongla
  [27.94058, 86.721246], //Thangnak
  [27.9535, 86.6945], // Gokyo
  [27.8877, 86.6365] // Marlung
];

const getHalts = () => halts;

const summits = [
  [27.925527275065452, 86.87898159027101], // Chhukung Ri
  [27.92990551745897, 86.83660816488556], // Kongma La
  [28.004240016938017, 86.85706000015217], // EBC
  [27.995700274264355, 86.82849997210725], // Kala Patthar
  [27.962122, 86.751923], // Cho La
  [27.962148839539353, 86.68291701535055], // Gokyo Ri
  [27.9473697, 86.6584966] // Renjo La
];

const getSummits = () => summits;

export { getDayWiseDataP, getDayWiseDataG, getHalts, getSummits };
