"use strict";(globalThis.webpackChunksuperset=globalThis.webpackChunksuperset||[]).push([[3139],{62276:(e,t,a)=>{a.d(t,{M:()=>o,S:()=>n});var l=a(60593),r=a(51995);const i=l.Z.RangePicker,n=(0,r.iK)(i)`
  border-radius: ${({theme:e})=>e.gridUnit}px;
`,o=l.Z},93139:(e,t,a)=>{a.d(t,{p:()=>ce,Z:()=>de});var l=a(73126),r=a(51995),i=a(61988),n=a(67294),o=a(29487),s=a(94184),d=a.n(s),c=a(35932),u=a(13322),g=a(49576),p=a(64158),h=a(97754),m=a(31069),f=a(49238),b=a(74069),v=a(84101),y=a(60718),x=a(11965);const w=r.iK.div`
  .bulk-tag-text {
    margin-bottom: ${({theme:e})=>2.5*e.gridUnit}px;
  }
`,Z=({show:e,selected:t=[],onHide:a,refreshData:l,resourceName:r,addSuccessToast:o,addDangerToast:s})=>{(0,n.useEffect)((()=>{}),[]);const[d,u]=(0,n.useState)([]);return(0,x.tZ)(b.default,{title:(0,i.t)("Bulk tag"),show:e,onHide:()=>{u([]),a()},footer:(0,x.tZ)("div",null,(0,x.tZ)(c.Z,{buttonStyle:"secondary",onClick:a},(0,i.t)("Cancel")),(0,x.tZ)(c.Z,{buttonStyle:"primary",onClick:async()=>{await m.Z.post({endpoint:"/api/v1/tag/bulk_create",jsonPayload:{tags:d.map((e=>({name:e.value,objects_to_tag:t.map((e=>[r,+e.original.id]))})))}}).then((({json:e={}})=>{const t=e.result.objects_skipped,a=e.result.objects_tagged;t.length>0&&o((0,i.t)("%s items could not be tagged because you don’t have edit permissions to all selected objects.",t.length,r)),o((0,i.t)("Tagged %s %ss",a.length,r))})).catch((e=>{s((0,i.t)("Failed to tag items"))})),l(),a(),u([])}},(0,i.t)("Save")))},(0,x.tZ)(w,null,(0,x.tZ)("div",{className:"bulk-tag-text"},(0,i.t)("You are adding tags to %s %ss",t.length,r)),(0,x.tZ)(f.lX,null,(0,i.t)("tags")),(0,x.tZ)(v.Z,{ariaLabel:"tags",value:d,options:y.m,onHide:a,onChange:e=>u(e),placeholder:(0,i.t)("Select Tags"),mode:"multiple"})))},S=r.iK.div`
  ${({theme:e,showThumbnails:t})=>`\n    display: grid;\n    grid-gap: ${12*e.gridUnit}px ${4*e.gridUnit}px;\n    grid-template-columns: repeat(auto-fit, 300px);\n    margin-top: ${-6*e.gridUnit}px;\n    padding: ${t?`${8*e.gridUnit+3}px ${9*e.gridUnit}px`:`${8*e.gridUnit+1}px ${9*e.gridUnit}px`};\n  `}
`,C=r.iK.div`
  border: 2px solid transparent;
  &.card-selected {
    border: 2px solid ${({theme:e})=>e.colors.primary.base};
  }
  &.bulk-select {
    cursor: pointer;
  }
`;function k({bulkSelectEnabled:e,loading:t,prepareRow:a,renderCard:l,rows:r,showThumbnails:i}){return l?(0,x.tZ)(S,{showThumbnails:i},t&&0===r.length&&[...new Array(25)].map(((e,a)=>(0,x.tZ)("div",{key:a},l({loading:t})))),r.length>0&&r.map((r=>l?(a(r),(0,x.tZ)(C,{className:d()({"card-selected":e&&r.isSelected,"bulk-select":e}),key:r.id,onClick:t=>{return a=t,l=r.toggleRowSelected,void(e&&(a.preventDefault(),a.stopPropagation(),l()));var a,l},role:"none"},l({...r.original,loading:t}))):null))):null}var $=a(68135),T=a(4715),_=a(18446),F=a.n(_),I=a(79521),P=a(35755),R=a(15926),U=a.n(R);const N={encode:e=>void 0===e?void 0:U().encode(e).replace(/%/g,"%25").replace(/&/g,"%26").replace(/\+/g,"%2B").replace(/#/g,"%23"),decode:e=>void 0===e||Array.isArray(e)?void 0:U().decode(e)};class B extends Error{constructor(...e){super(...e),this.name="ListViewError"}}function M(e,t){return e.map((({id:e,urlDisplay:a,operator:l})=>({id:e,urlDisplay:a,operator:l,value:t[a||e]})))}function D(e,t){const a=[],l={};return Object.keys(e).forEach((t=>{const r={id:t,value:e[t]};l[t]=r,a.push(r)})),t.forEach((e=>{const t=e.urlDisplay||e.id,a=l[t];a&&(a.operator=e.operator,a.id=e.id)})),a}const E=r.iK.div`
  width: ${200}px;
`,A=(0,r.iK)(u.Z.Search)`
  color: ${({theme:e})=>e.colors.grayscale.light1};
`,V=(0,r.iK)(T.oc)`
  border-radius: ${({theme:e})=>e.gridUnit}px;
`;function H({Header:e,name:t,initialValue:a,onSubmit:l},r){const[o,s]=(0,n.useState)(a||""),d=()=>{o&&l(o.trim())};return(0,n.useImperativeHandle)(r,(()=>({clearFilter:()=>{s(""),l("")}}))),(0,x.tZ)(E,null,(0,x.tZ)(f.lX,null,e),(0,x.tZ)(V,{allowClear:!0,placeholder:(0,i.t)("Type a value"),name:t,value:o,onChange:e=>{s(e.currentTarget.value),""===e.currentTarget.value&&l("")},onPressEnter:d,onBlur:d,prefix:(0,x.tZ)(A,{iconSize:"l"})}))}const z=(0,n.forwardRef)(H),K=r.iK.div`
  display: inline-flex;
  font-size: ${({theme:e})=>e.typography.sizes.s}px;
  align-items: center;
  width: ${200}px;
`;function O({Header:e,name:t,fetchSelects:a,initialValue:l,onSelect:r,selects:o=[]},s){const[d,c]=(0,n.useState)(l),u=e=>{r(e?{label:e.label,value:e.value}:void 0),c(e)},g=()=>{r(void 0,!0),c(void 0)};(0,n.useImperativeHandle)(s,(()=>({clearFilter:()=>{g()}})));const p=(0,n.useMemo)((()=>async(e,t,l)=>{if(a){const r=await a(e,t,l);return{data:r.data,totalCount:r.totalCount}}return{data:[],totalCount:0}}),[a]);return(0,x.tZ)(K,null,a?(0,x.tZ)(v.Z,{allowClear:!0,ariaLabel:"string"==typeof e?e:t||(0,i.t)("Filter"),header:(0,x.tZ)(f.lX,null,e),onChange:u,onClear:g,options:p,placeholder:(0,i.t)("Select or type a value"),showSearch:!0,value:d}):(0,x.tZ)(T.Ph,{allowClear:!0,ariaLabel:"string"==typeof e?e:t||(0,i.t)("Filter"),header:(0,x.tZ)(f.lX,null,e),labelInValue:!0,onChange:u,onClear:g,options:o,placeholder:(0,i.t)("Select or type a value"),showSearch:!0,value:d}))}const j=(0,n.forwardRef)(O);var L=a(30381),X=a.n(L),q=a(62276);const W=r.iK.div`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  width: 360px;
`;function G({Header:e,initialValue:t,onSubmit:a},l){const[r,o]=(0,n.useState)(null!=t?t:null),s=(0,n.useMemo)((()=>!r||Array.isArray(r)&&!r.length?null:[X()(r[0]),X()(r[1])]),[r]);return(0,n.useImperativeHandle)(l,(()=>({clearFilter:()=>{o(null),a([])}}))),(0,x.tZ)(W,null,(0,x.tZ)(f.lX,null,e),(0,x.tZ)(q.S,{placeholder:[(0,i.t)("Start date"),(0,i.t)("End date")],showTime:!0,value:s,onChange:e=>{var t,l,r,i;if(!e)return o(null),void a([]);const n=[null!=(t=null==(l=e[0])?void 0:l.valueOf())?t:0,null!=(r=null==(i=e[1])?void 0:i.valueOf())?r:0];o(n),a(n)}}))}const J=(0,n.forwardRef)(G);function Q({filters:e,internalFilters:t=[],updateFilterValue:a},l){const r=(0,n.useMemo)((()=>Array.from({length:e.length},(()=>(0,n.createRef)()))),[e.length]);return(0,n.useImperativeHandle)(l,(()=>({clearFilters:()=>{r.forEach((e=>{var t;null==(t=e.current)||null==t.clearFilter||t.clearFilter()}))}}))),(0,x.tZ)(n.Fragment,null,e.map((({Header:e,fetchSelects:l,key:i,id:n,input:o,paginate:s,selects:d,onFilterUpdate:c},u)=>{var g;const p=null==t||null==(g=t[u])?void 0:g.value;return"select"===o?(0,x.tZ)(j,{ref:r[u],Header:e,fetchSelects:l,initialValue:p,key:i,name:n,onSelect:(e,t)=>{c&&(t||c(e)),a(u,e)},paginate:s,selects:d}):"search"===o&&"string"==typeof e?(0,x.tZ)(z,{ref:r[u],Header:e,initialValue:p,key:i,name:n,onSubmit:e=>{c&&c(e),a(u,e)}}):"datetime_range"===o?(0,x.tZ)(J,{ref:r[u],Header:e,initialValue:p,key:i,name:n,onSubmit:e=>a(u,e)}):null})))}const Y=(0,$.b)((0,n.forwardRef)(Q)),ee=r.iK.div`
  display: inline-flex;
  font-size: ${({theme:e})=>e.typography.sizes.s}px;
  align-items: center;
  text-align: left;
  width: ${200}px;
`,te=({initialSort:e,onChange:t,options:a})=>{const l=e&&a.find((({id:t,desc:a})=>t===e[0].id&&a===e[0].desc))||a[0],[r,o]=(0,n.useState)({label:l.label,value:l.value}),s=(0,n.useMemo)((()=>a.map((e=>({label:e.label,value:e.value})))),[a]);return(0,x.tZ)(ee,null,(0,x.tZ)(T.Ph,{ariaLabel:(0,i.t)("Sort"),header:(0,x.tZ)(f.lX,null,(0,i.t)("Sort")),labelInValue:!0,onChange:e=>{o(e);const l=a.find((({value:t})=>t===e.value));if(l){const e=[{id:l.id,desc:l.desc}];t(e)}},options:s,showSearch:!0,value:r}))};var ae=a(94301);const le=r.iK.div`
  text-align: center;

  .superset-list-view {
    text-align: left;
    border-radius: 4px 0;
    margin: 0 ${({theme:e})=>4*e.gridUnit}px;

    .header {
      display: flex;
      padding-bottom: ${({theme:e})=>4*e.gridUnit}px;

      & .controls {
        display: flex;
        flex-wrap: wrap;
        column-gap: ${({theme:e})=>6*e.gridUnit}px;
        row-gap: ${({theme:e})=>4*e.gridUnit}px;
      }
    }

    .body.empty table {
      margin-bottom: 0;
    }

    .body {
      overflow-x: auto;
    }

    .ant-empty {
      .ant-empty-image {
        height: auto;
      }
    }
  }

  .pagination-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: ${({theme:e})=>4*e.gridUnit}px;
  }

  .row-count-container {
    margin-top: ${({theme:e})=>2*e.gridUnit}px;
    color: ${({theme:e})=>e.colors.grayscale.base};
  }
`,re=(0,r.iK)(o.Z)`
  ${({theme:e})=>`\n    border-radius: 0;\n    margin-bottom: 0;\n    color: ${e.colors.grayscale.dark1};\n    background-color: ${e.colors.primary.light4};\n\n    .selectedCopy {\n      display: inline-block;\n      padding: ${2*e.gridUnit}px 0;\n    }\n\n    .deselect-all, .tag-btn {\n      color: ${e.colors.primary.base};\n      margin-left: ${4*e.gridUnit}px;\n    }\n\n    .divider {\n      margin: ${2*-e.gridUnit}px 0 ${2*-e.gridUnit}px ${4*e.gridUnit}px;\n      width: 1px;\n      height: ${8*e.gridUnit}px;\n      box-shadow: inset -1px 0px 0px ${e.colors.grayscale.light2};\n      display: inline-flex;\n      vertical-align: middle;\n      position: relative;\n    }\n\n    .ant-alert-close-icon {\n      margin-top: ${1.5*e.gridUnit}px;\n    }\n  `}
`,ie={Cell:({row:e})=>(0,x.tZ)(g.Z,(0,l.Z)({},e.getToggleRowSelectedProps(),{id:e.id})),Header:({getToggleAllRowsSelectedProps:e})=>(0,x.tZ)(g.Z,(0,l.Z)({},e(),{id:"header-toggle-all"})),id:"selection",size:"sm"},ne=r.iK.div`
  padding-right: ${({theme:e})=>4*e.gridUnit}px;
  margin-top: ${({theme:e})=>5*e.gridUnit+1}px;
  white-space: nowrap;
  display: inline-block;

  .toggle-button {
    display: inline-block;
    border-radius: ${({theme:e})=>e.gridUnit/2}px;
    padding: ${({theme:e})=>e.gridUnit}px;
    padding-bottom: ${({theme:e})=>.5*e.gridUnit}px;

    &:first-of-type {
      margin-right: ${({theme:e})=>2*e.gridUnit}px;
    }
  }

  .active {
    background-color: ${({theme:e})=>e.colors.grayscale.base};
    svg {
      color: ${({theme:e})=>e.colors.grayscale.light5};
    }
  }
`,oe=r.iK.div`
  padding: ${({theme:e})=>40*e.gridUnit}px 0;

  &.table {
    background: ${({theme:e})=>e.colors.grayscale.light5};
  }
`,se=({mode:e,setMode:t})=>(0,x.tZ)(ne,null,(0,x.tZ)("div",{role:"button",tabIndex:0,onClick:e=>{e.currentTarget.blur(),t("card")},className:d()("toggle-button",{active:"card"===e})},(0,x.tZ)(u.Z.CardView,null)),(0,x.tZ)("div",{role:"button",tabIndex:0,onClick:e=>{e.currentTarget.blur(),t("table")},className:d()("toggle-button",{active:"table"===e})},(0,x.tZ)(u.Z.ListView,null))),de=function({columns:e,data:t,count:a,pageSize:r,fetchData:o,refreshData:s,loading:d,initialSort:u=[],className:g="",filters:m=[],bulkActions:f=[],bulkSelectEnabled:b=!1,disableBulkSelect:v=(()=>{}),renderBulkSelectCopy:y=(e=>(0,i.t)("%s Selected",e.length)),renderCard:w,showThumbnails:S,cardSortSelectOptions:C,defaultViewMode:$="card",highlightRowId:T,emptyState:_,columnsForWrapText:R,enableBulkTag:U=!1,bulkTagResourceName:E,addSuccessToast:A,addDangerToast:V}){const{getTableProps:H,getTableBodyProps:z,headerGroups:K,rows:O,prepareRow:j,pageCount:L=1,gotoPage:X,applyFilterValue:q,setSortBy:W,selectedFlatRows:G,toggleAllRowsSelected:J,setViewMode:Q,state:{pageIndex:ee,pageSize:ne,internalFilters:de,sortBy:ce,viewMode:ue},query:ge}=function({fetchData:e,columns:t,data:a,count:l,initialPageSize:r,initialFilters:i=[],initialSort:o=[],bulkSelectMode:s=!1,bulkSelectColumnConfig:d,renderCard:c=!1,defaultViewMode:u="card"}){const[g,p]=(0,P.Kx)({filters:N,pageIndex:P.yz,sortColumn:P.Zp,sortOrder:P.Zp,viewMode:P.Zp}),h=(0,n.useMemo)((()=>g.sortColumn&&g.sortOrder?[{id:g.sortColumn,desc:"desc"===g.sortOrder}]:o),[o,g.sortColumn,g.sortOrder]),m={filters:g.filters?D(g.filters,i):[],pageIndex:g.pageIndex||0,pageSize:r,sortBy:h},[f,b]=(0,n.useState)(g.viewMode||(c?u:"table")),v=(0,n.useMemo)((()=>{const e=t.map((e=>({...e,filter:"exact"})));return s?[d,...e]:e}),[s,t]),{getTableProps:y,getTableBodyProps:x,headerGroups:w,rows:Z,prepareRow:S,canPreviousPage:C,canNextPage:k,pageCount:$,gotoPage:T,setAllFilters:_,setSortBy:R,selectedFlatRows:U,toggleAllRowsSelected:B,state:{pageIndex:E,pageSize:A,sortBy:V,filters:H}}=(0,I.useTable)({columns:v,count:l,data:a,disableFilters:!0,disableSortRemove:!0,initialState:m,manualFilters:!0,manualPagination:!0,manualSortBy:!0,autoResetFilters:!1,pageCount:Math.ceil(l/r)},I.useFilters,I.useSortBy,I.usePagination,I.useRowState,I.useRowSelect),[z,K]=(0,n.useState)(g.filters&&i.length?M(i,g.filters):[]);return(0,n.useEffect)((()=>{i.length&&K(M(i,g.filters?g.filters:{}))}),[i]),(0,n.useEffect)((()=>{const t={};z.forEach((e=>{if(void 0!==e.value&&("string"!=typeof e.value||e.value.length>0)){const a=e.urlDisplay||e.id;t[a]=e.value}}));const a={filters:Object.keys(t).length?t:void 0,pageIndex:E};V[0]&&(a.sortColumn=V[0].id,a.sortOrder=V[0].desc?"desc":"asc"),c&&(a.viewMode=f);const l=void 0!==g.pageIndex&&a.pageIndex!==g.pageIndex?"push":"replace";p(a,l),e({pageIndex:E,pageSize:A,sortBy:V,filters:H})}),[e,E,A,V,H]),(0,n.useEffect)((()=>{F()(m.pageIndex,E)||T(m.pageIndex)}),[g]),{canNextPage:k,canPreviousPage:C,getTableBodyProps:x,getTableProps:y,gotoPage:T,headerGroups:w,pageCount:$,prepareRow:S,rows:Z,selectedFlatRows:U,setAllFilters:_,setSortBy:R,state:{pageIndex:E,pageSize:A,sortBy:V,filters:H,internalFilters:z,viewMode:f},toggleAllRowsSelected:B,applyFilterValue:(e,t)=>{K((a=>{if(a[e].value===t)return a;const l={...a[e],value:t},r=function(e,t,a){const l=e.find(((e,a)=>t===a));return[...e.slice(0,t),{...l,...a},...e.slice(t+1)]}(a,e,l);return _(r.filter((e=>!(void 0===e.value||Array.isArray(e.value)&&!e.value.length))).map((({value:e,operator:t,id:a})=>"between"===t&&Array.isArray(e)?[{value:e[0],operator:"gt",id:a},{value:e[1],operator:"lt",id:a}]:{value:e,operator:t,id:a})).flat()),T(0),r}))},setViewMode:b,query:g}}({bulkSelectColumnConfig:ie,bulkSelectMode:b&&Boolean(f.length),columns:e,count:a,data:t,fetchData:o,initialPageSize:r,initialSort:u,initialFilters:m,renderCard:Boolean(w),defaultViewMode:$}),pe=E&&U,he=Boolean(m.length);if(he){const t=e.reduce(((e,t)=>({...e,[t.id||t.accessor]:!0})),{});m.forEach((e=>{if(!t[e.id])throw new B(`Invalid filter config, ${e.id} is not present in columns`)}))}const me=(0,n.useRef)(null),fe=(0,n.useCallback)((()=>{var e;ge.filters&&(null==(e=me.current)||e.clearFilters())}),[ge.filters]),be=Boolean(w),[ve,ye]=(0,n.useState)(!1);return(0,n.useEffect)((()=>{b||J(!1)}),[b,J]),(0,n.useEffect)((()=>{!d&&ee>L-1&&L>0&&X(0)}),[X,d,L,ee]),(0,x.tZ)(le,null,pe&&(0,x.tZ)(Z,{show:ve,selected:G,refreshData:s,resourceName:E,addSuccessToast:A,addDangerToast:V,onHide:()=>ye(!1)}),(0,x.tZ)("div",{className:`superset-list-view ${g}`},(0,x.tZ)("div",{className:"header"},be&&(0,x.tZ)(se,{mode:ue,setMode:Q}),(0,x.tZ)("div",{className:"controls"},he&&(0,x.tZ)(Y,{ref:me,filters:m,internalFilters:de,updateFilterValue:q}),"card"===ue&&C&&(0,x.tZ)(te,{initialSort:ce,onChange:e=>W(e),options:C}))),(0,x.tZ)("div",{className:"body "+(0===O.length?"empty":"")},b&&(0,x.tZ)(re,{type:"info",closable:!0,showIcon:!1,onClose:v,message:(0,x.tZ)(n.Fragment,null,(0,x.tZ)("div",{className:"selectedCopy"},y(G)),Boolean(G.length)&&(0,x.tZ)(n.Fragment,null,(0,x.tZ)("span",{role:"button",tabIndex:0,className:"deselect-all",onClick:()=>J(!1)},(0,i.t)("Deselect all")),(0,x.tZ)("div",{className:"divider"}),f.map((e=>(0,x.tZ)(c.Z,{key:e.key,buttonStyle:e.type,cta:!0,onClick:()=>e.onSelect(G.map((e=>e.original)))},e.name))),U&&(0,x.tZ)("span",{role:"button",tabIndex:0,className:"tag-btn",onClick:()=>ye(!0)},(0,i.t)("Add Tag"))))}),"card"===ue&&(0,x.tZ)(k,{bulkSelectEnabled:b,prepareRow:j,renderCard:w,rows:O,loading:d,showThumbnails:S}),"table"===ue&&(0,x.tZ)(h.Z,{getTableProps:H,getTableBodyProps:z,prepareRow:j,headerGroups:K,rows:O,columns:e,loading:d,highlightRowId:T,columnsForWrapText:R}),!d&&0===O.length&&(0,x.tZ)(oe,{className:ue},ge.filters?(0,x.tZ)(ae.XJ,{title:(0,i.t)("No results match your filter criteria"),description:(0,i.t)("Try different criteria to display results."),image:"filter-results.svg",buttonAction:()=>fe(),buttonText:(0,i.t)("clear all filters")}):(0,x.tZ)(ae.XJ,(0,l.Z)({},_,{title:(null==_?void 0:_.title)||(0,i.t)("No Data"),image:(null==_?void 0:_.image)||"filter-results.svg"}))))),O.length>0&&(0,x.tZ)("div",{className:"pagination-container"},(0,x.tZ)(p.Z,{totalPages:L||0,currentPage:L&&ee<L?ee+1:0,onChange:e=>X(e-1),hideFirstAndLastPageLinks:!0}),(0,x.tZ)("div",{className:"row-count-container"},!d&&(0,i.t)("%s-%s of %s",ne*ee+(O.length&&1),ne*ee+O.length,a))))};var ce;!function(e){e.StartsWith="sw",e.EndsWith="ew",e.Contains="ct",e.Equals="eq",e.NotStartsWith="nsw",e.NotEndsWith="new",e.NotContains="nct",e.NotEquals="neq",e.GreaterThan="gt",e.LessThan="lt",e.RelationManyMany="rel_m_m",e.RelationOneMany="rel_o_m",e.TitleOrSlug="title_or_slug",e.NameOrDescription="name_or_description",e.AllText="all_text",e.ChartAllText="chart_all_text",e.DatasetIsNullOrEmpty="dataset_is_null_or_empty",e.Between="between",e.DashboardIsFav="dashboard_is_favorite",e.ChartIsFav="chart_is_favorite",e.ChartIsCertified="chart_is_certified",e.DashboardIsCertified="dashboard_is_certified",e.DatasetIsCertified="dataset_is_certified",e.DashboardHasCreatedBy="dashboard_has_created_by",e.ChartHasCreatedBy="chart_has_created_by",e.DashboardTags="dashboard_tags",e.ChartTags="chart_tags",e.SavedQueryTags="saved_query_tags"}(ce||(ce={}))}}]);
//# sourceMappingURL=5866ed883e38d9782e0b.chunk.js.map