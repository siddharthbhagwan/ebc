import tentIcon from "../resources/images/tent.svg";
import summitIcon from "../resources/images/summit.svg";
import passIcon from "../resources/images/pass.svg";
import ebcIcon from "../resources/images/ebc.svg";
import "../resources/css/legend.css";
import "../resources/css/dashboard.css";

const getLegendHtml = () => `
<img src="${ebcIcon}" width="20px"> Everest Base Camp <br/>
<img src="${summitIcon}" width="20px"> Summit <br/>
<img src="${passIcon}" width="20px"> Pass <br/>
<img src="${tentIcon}" width="15px"> Lodging
`;

const getPeakAlt = (props: any) => {
  if (props.peak_alt) {
    return `- ${props.peak_alt} ft`;
  }
  return "";
};

const getStartAlt = (props: any) => {
  if (props.start_alt) {
    return `${props.start_alt} ft`;
  }
  return "";
};

const getEndAlt = (props: any) => {
  if (props.end_alt) {
    return `- ${props.end_alt} ft`;
  }
  return "";
};

const getTimeDist = (props: any) => {
  if (props.distance && props.time) {
    return `
      <div>
        ${props.distance}<br />
        ${props.time}
      </div>
    `;
  }
  return "";
};

const getDashboardHtml = (props: any) => `
  <h5>EBC 3 Pass Trek, Nepal</h5>
  <br/>
  <div class="dashboardDetails">
    <div>Day ${props.day}</div><br/>
    
    <div>
      <span>${props.name}</span>
      <br/>
      ${getStartAlt(props)}
      ${getPeakAlt(props)}
      ${getEndAlt(props)}
      <br/>
    </div><br/>
    
    ${getTimeDist(props)}
  </div
`;

export { getDashboardHtml, getLegendHtml };
