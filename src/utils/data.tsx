import * as GeoJsonData from "./geoJson";
import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import airportIcon from "../resources/images/airport.svg";
import passIcon from "../resources/images/pass.svg";
import ebcIcon from "../resources/images/ebc.svg";

const lukla_to_phakding =
  "it~gDovjpOt@IFC@GKe@e@eBOGE@w@RaAXM@MFe@ZAJP~@J`@EB_@Ng@VONi@`Ai@tASr@m@t@_@`@k@v@cAv@qB^o@LABGP]Hy@H[AOREXIN[Va@N]Hc@FCAM[IAMJQPWGIWCIIEUGIAKSIQMCy@fAMXCPCVO\\ATGLCFELa@d@OHc@To@^_@DOLITCFw@b@KHCTINMLGFcALQBKFKJCVKPSHQ?GAQ@EDENATETBLALIHa@RWRa@~@w@`A[f@w@bAAXGLC`@IRKRIBs@Aw@d@MPMb@g@d@WPQb@SX[V[^Up@GXaAn@e@d@a@^WPKPc@RYf@Sb@g@`@c@PKNQHGTi@`@mApA]n@I^@^@PKZRp@I|@MJJPKVCVYTw@@SEe@IYQWH_A[e@S[]e@YeA{AZcB@m@y@I[TKP?XQTk@h@c@XOXQt@k@hBe@t@oAbAu@`ASTQ?i@Wg@b@k@Ag@YONSIW@MTK`@Ab@c@Lq@?}Bz@e@f@[d@S\\w@j@UH{@CoAn@MKY?gAVo@FUNa@Ac@AONEHDTKRUBg@VeA\\qNkBiEQGCmDeBwCY_@o@Ru@Y}@[CWQGCq@C]AUHGRAj@DZTv@Jh@Bh@N\\TZMtAI^i@F_@AcB]oDkAk@S}AQo@NSPe@Cg@HuALs@Iw@BeBCi@CcBe@oAEe@MEMWFa@DSBUCSJ}@Nk@E[HOH]@i@?WHW?U@OQOCWJUJSLQNMHKT[POFIEIFGCGBc@IEGc@NUNIPQ?WFS?Q?k@N_@JQVSBw@@SIUSa@SMCQKg@F[CKAiANy@NQ?]Ng@Dk@Jk@VyDhAsAEeF`Cy@^y@l@mAI}Bj@m@Q[DyD_BgAAQJyAt@o@Pi@@s@U]Y]Ye@OwA]q@i@GUMEQPIT";

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
  "7": GeoJsonData.chhukung_to_chhukung_ri_to_chhukung_7,
  "8": GeoJsonData.chhukung_to_kongma_la_to_lobuche_8,
  "10": GeoJsonData.lobuche_to_ebc_to_gorak_shep_10,
  "12": GeoJsonData.gorak_shep_to_kala_patthar_to_lobuche_12,
  "14": GeoJsonData.dzongla_to_thangnak_14,
  "15": GeoJsonData.thangnak_to_gokyo_15,
  "16": GeoJsonData.gokyo_to_gokyo_ri_16,
  "18": GeoJsonData.gokyo_to_marulung_18,
  "19": GeoJsonData.marulung_to_namche_bazaar_19
};
const getDayWiseDataG = () => dayWiseDataG;

const halts = [
  { icon: tentIcon, point: [27.74004, 86.712555] }, // Phakding
  { icon: tentIcon, point: [27.8069, 86.714] }, // Namche Bazaar
  { icon: tentIcon, point: [27.8362, 86.7646] }, // Tengboche
  { icon: tentIcon, point: [27.8923, 86.8314] }, // Dingboche
  { icon: tentIcon, point: [27.9045, 86.8713] }, // Chhukung
  { icon: tentIcon, point: [27.9485, 86.8104] }, // Lobuche
  { icon: tentIcon, point: [27.9809, 86.8285] }, // Gorak Shep
  { icon: tentIcon, point: [27.9397, 86.7733] }, // Dzongla
  { icon: tentIcon, point: [27.94058, 86.721246] }, //Thangnak
  { icon: tentIcon, point: [27.9535, 86.6945] }, // Gokyo
  { icon: tentIcon, point: [27.8877, 86.6365] } // Marlung
];
const getHalts = () => halts;

const summits = [
  { point: [27.925527275065452, 86.87898159027101], icon: summitIcon }, // Chhukung Ri
  { point: [28.004240016938017, 86.85706000015217], icon: ebcIcon }, // EBC
  { point: [27.995700274264355, 86.82849997210725], icon: summitIcon }, // Kala Patthar
  { point: [27.962148839539353, 86.68291701535055], icon: summitIcon }, // Gokyo Ri
  { point: [27.92990551745897, 86.83660816488556], icon: passIcon }, // Kongma La
  { point: [27.962122, 86.751923], icon: passIcon }, // Cho La
  { point: [27.9473697, 86.6584966], icon: passIcon }, // Renjo La
  { point: [27.68725044382488, 86.73143742664253], icon: airportIcon } // airport
];
const getSummits = () => summits;

const polyLineProperties = {
  "1": {
    day: 1,
    name: "Lukla - Phakding",
    distance: "4.66 mi / 7.5 km",
    time: "3h 30m",
    start_alt: "9,373",
    end_alt: "8,563",
    net_climb: "-1,060",
    descent: "705",
    color: "#FABC74"
  },
  "2": {
    day: "2",
    name: "Phakding - Namache Bazaar",
    distance: "6.72 mi / 10.81 km",
    time: "5h 30m",
    start_alt: "8,563",
    end_alt: "11,286",
    total_climb: "3,556",
    descent: "935",
    color: "#F3A96E"
  },
  "4": {
    day: "4",
    name: "Namache Bazaar - Tengboche",
    distance: "5.95 mi / 9.57 km",
    time: "5h 30m",
    start_alt: "11,286",
    end_alt: "12,644",
    total_climb: "2,785",
    descent: "1,283",
    color: "#EC9769"
  },
  "5": {
    day: "5",
    name: "Tengboche - Dingboche",
    distance: "6.71 mi / 10.8 km",
    time: "5h 30m",
    start_alt: "12,644",
    end_alt: "14,470",
    total_climb: "",
    descent: "",
    color: "#E58463"
  },
  "6": {
    day: "6",
    name: "Dingboche - Chhukung",
    distance: "2.80 mi / 10.41 km",
    time: "4h 00m",
    start_alt: "14,470",
    end_alt: "15,535",
    total_climb: "",
    descent: "",
    color: "#DE725E"
  },
  "13": {
    day: "13",
    name: "Lobuche - Dzongla",
    distance: "3.91 mi / 6.29 km",
    time: "4h 00m",
    start_alt: "16,210",
    end_alt: "15,850",
    total_climb: "",
    descent: "",
    color: "#BB1542"
  }
};
const getPolyLineProperties = () => polyLineProperties;

export {
  getDayWiseDataP,
  getDayWiseDataG,
  getHalts,
  getPolyLineProperties,
  getSummits
};
