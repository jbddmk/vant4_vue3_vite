<template>
    <header>
      <div class="header">
<!--        <span class="sign-btn-open" :class="{'open-menu':toggleOpenVal}" @click="toggleOpen">签章</span>-->
        <h1 id="title">{{title}}</h1>
      </div>
    </header>

    <div id="viewerContainer">
        <div id="viewer" class="pdfViewer"></div>
    </div>

    <div id="loadingBar">
        <div class="progress"></div>
        <div class="glimmer"></div>
    </div>

    <div id="errorWrapper" hidden="true">
        <div id="errorMessageLeft">
            <span id="errorMessage"></span>
            <button id="errorShowMore">
                More Information
            </button>
            <button id="errorShowLess">
                Less Information
            </button>
        </div>
        <div id="errorMessageRight">
            <button id="errorClose">
                Close
            </button>
        </div>
        <div class="clearBoth"></div>
        <textarea id="errorMoreInfo" hidden="true" readonly="readonly"></textarea>
    </div>
    <!--    触控区-->
    <!--    个人章-->
  <div class="left-too-bar" :class="{'show-tool':toggleOpenVal,'hidden-tool':!toggleOpenVal}">
    <div class="tool-item" v-for="it in sealList" :key="it.id">
      <template v-if="it.sealType==1">
        <div class="tool-sign-text">
          <span>个人章:</span>
        </div>
        <div class="sign touch-el"  data-type="1" :data-signid="it.id" :style="{width:personalImgWScale+'px',height:personalImgHScale+'px'}">
          <div class="sign-one sign-img child">
            <img :src="it.sealImgPath"/>
          </div>
          <div class="del-btn">x</div>
        </div>
      </template>
      <template v-if="it.sealType==0">
        <div class="tool-sign-text">
          <span>公章:</span>
        </div>
        <div class="sign touch-el" data-type="0" :data-signid="it.id" :style="{width:publicImgWScale+'px',height:publicImgHScale+'px'}">
          <div class="sign-one sign-img child">
            <img :src="it.sealImgPath"/>
          </div>
          <div class="del-btn">x</div>
        </div>
      </template>
    </div>
  </div>

<!-- 复现克隆区域 -->
<!--    复现区个人-->
    <div class="sign sign-one-copy" style="display: none" :style="{width:personalImgWScale+'px',height:personalImgHScale+'px'}"  data-type="1" data-id="user-id-001">
        <div class="sign-img child">
            <img src=""/>
        </div>
      <div class="del-btn">x</div>
    </div>
<!--  公章-->
  <div class="sign sign-public-copy" style="display: none" :style="{width:publicImgWScale+'px',height:publicImgHScale+'px'}"  data-type="0" data-id="user-id-001">
    <div class="sign-img child">
      <img src=""/>
    </div>
    <div class="del-btn">x</div>
  </div>

    <footer>
        <button class="toolbarButton pageUp" title="Previous Page" id="previous"></button>
        <button class="toolbarButton pageDown" title="Next Page" id="next"></button>
        <input type="number" id="pageNumber" class="toolbarField pageNumber" value="1" size="4" min="1">
        <button v-show="false" class="toolbarButton zoomOut" title="Zoom Out" id="zoomOut"></button>
        <button v-show="false" class="toolbarButton zoomIn" title="Zoom In" id="zoomIn"></button>
        <template v-if="isCanDo==1">
        <button class="toolbarButton btn-sign" :class="{'open-menu':toggleOpenVal}" title="btn-sign" id="btn-sign" style="font-size: 15px" @click="toggleOpen()">签章</button>
        <button class="toolbarButton del" title="del" id="del" style="font-size: 15px" @click="delMenu()">删除</button>
        <button class="toolbarButton save" title="save" id="save" style="font-size: 15px" @click="save()">保存</button>
        </template>
    </footer>

  <van-overlay :show="loading" style="z-index:20">
    <div style="display:flex;justify-content: center;align-items: center;height:100vh;wight:100vw;">
      <van-loading vertical color="#0094ff">
        <template #icon>
          <van-icon name="star-o" size="30" />
        </template>
        加载中...
      </van-loading>
    </div>
  </van-overlay>
  <van-dialog v-model:show="show" title="设置印章插入页" show-cancel-button @confirm="createMore" @cancel="cancelMore" :before-close="checkMore">
    <div class="form-top">
      <van-radio-group v-model="form.ruleType" direction="horizontal">
        <van-radio name="1">全部</van-radio>
        <van-radio name="2">自定义</van-radio>
      </van-radio-group>
    </div>
    <div class="form-center">
      <van-cell-group inset v-show="form.ruleType==2">
        <van-field v-model="form.rule" label="页码" placeholder="请输入" />
      </van-cell-group>
      <div class="page-rule-read" v-show="form.ruleType==2">
        <div>
          1、指定单页（9）
        </div>
        <div>
          2、多页（2,3）
        </div>
        <div>
          3、单页加区间输入（1,2-3）
        </div>
        <div>
          4、区间输入（2-3,6-9）
        </div>
      </div>
    </div>
  </van-dialog>
</template>

<script setup>
    import wx from 'weixin-js-sdk'
    import {onMounted,nextTick,ref,watch} from 'vue'
    import { useRoute,useRouter } from 'vue-router'
    import { showToast} from 'vant';
    import { getSealsApi,getPdfInfoByIdApi,saveSealApi,repairSealApi } from "@/api/sign"
    const route = useRoute()
    const loading = ref(false)
    const show = ref(false)
    const title = ref('')
    const form = ref({ ruleType:'',rule:'' })
    /**
     *  request params
     * */
    const projectId = ref(null)
    const pdfId = ref('')
    const isCanDo = ref(0)  //数据权限,是否允许操作数据
    let signT = 0  //0签章，1补章
    let token=''
    let apipre =''
    projectId.value = route.query.projectId
    pdfId.value = route.query.pdfId
    signT = route.query.signT
    isCanDo.value = route.query.isCanDo
    token = route.query.token
    apipre = route.query.apipre
    if(!token||!pdfId.value||signT===undefined||isCanDo.value===undefined||apipre===undefined||!projectId.value){
      showToast('缺少参数');
    }
    sessionStorage.setItem('token',token)
    sessionStorage.setItem('apipre',apipre)

    onMounted(() => {
      if (!pdfjsLib.getDocument || !pdfjsViewer.PDFViewer) {
        showToast('缺少全局变量');
      }
    })
    const allPages = ref(0)
    const signData = ref([])
    /** 缩放控制相关 */
    let scaleReal = ref(0)
    const toggleOpenVal = ref(false)
    const toggleOpen = ()=>{
      toggleOpenVal.value = !toggleOpenVal.value
      if(toggleOpenVal.value){
        bindMove()
      }
    }
    const isDel = ref(false)
    /** pdf相关配置 */
    const USE_ONLY_CSS_ZOOM = true;
    const TEXT_LAYER_MODE = 0; // DISABLE
    const MAX_IMAGE_SIZE = 1024 * 1024;
    const CMAP_URL = import.meta.env.BASE_URL+ "pdfjs-dist/cmaps/";
    const CMAP_PACKED = true;
    pdfjsLib.GlobalWorkerOptions.workerSrc = import.meta.env.BASE_URL + "pdfjs-dist/build/pdf.worker.js";

    // let DEFAULT_URL = "/test.pdf";
    let DEFAULT_URL = ''
    const DEFAULT_SCALE_DELTA = 1.1;
    const MIN_SCALE = 0.25;
    const MAX_SCALE = 2.0;
    const DEFAULT_SCALE_VALUE = "auto";
    const PDFViewerApplication = {
      pdfLoadingTask: null,
      pdfDocument: null,
      pdfViewer: null,
      pdfHistory: null,
      pdfLinkService: null,
      eventBus: null,

      /**
       * Opens PDF document specified by URL.
       * @returns {Promise} - Returns the promise, which is resolved when document
       *                      is opened.
       */
      open(params) {
        if (this.pdfLoadingTask) {
          // We need to destroy already opened document
          return this.close().then(
              function () {
                // ... and repeat the open() call.
                return this.open(params);
              }.bind(this)
          );
        }

        const url = params.url;
        const self = this;
        this.setTitleUsingUrl(url);

        // Loading document.
        const loadingTask = pdfjsLib.getDocument({
          url,
          maxImageSize: MAX_IMAGE_SIZE,
          cMapUrl: CMAP_URL,
          cMapPacked: CMAP_PACKED,
        });
        this.pdfLoadingTask = loadingTask;

        loadingTask.onProgress = function (progressData) {
          self.progress(progressData.loaded / progressData.total);
        };

        return loadingTask.promise.then(
            function (pdfDocument) {
              // pdfDocument.getPage(1).then(function(page) {
              //     let viewport = page.getViewport({ scale: 1, });
              //     console.log(viewport,'--原生大小--')
              // });
              // Document loaded, specifying document for the viewer.
              self.pdfDocument = pdfDocument;
              self.pdfViewer.setDocument(pdfDocument);
              self.pdfLinkService.setDocument(pdfDocument);
              self.pdfHistory.initialize({
                fingerprint: pdfDocument.fingerprints[0],
              });
              // console.log(self.pdfViewer._pages,222)
              // let scale1 = self.pdfViewer._pages[0].viewport.scale
              // let width1 = self.pdfViewer._pages[0].viewport.width
              // let w22 = scale1 * width1
              // console.log(w22,1122)

              self.loadingBar.hide();
              self.setTitleUsingMetadata(pdfDocument);
            },
            function (exception) {
              const message = exception && exception.message;
              const l10n = self.l10n;
              let loadingErrorMessage;

              if (exception instanceof pdfjsLib.InvalidPDFException) {
                // change error message also for other builds
                loadingErrorMessage = l10n.get(
                    "invalid_file_error",
                    null,
                    "Invalid or corrupted PDF file."
                );
              } else if (exception instanceof pdfjsLib.MissingPDFException) {
                // special message for missing PDFs
                loadingErrorMessage = l10n.get(
                    "missing_file_error",
                    null,
                    "Missing PDF file."
                );
              } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
                loadingErrorMessage = l10n.get(
                    "unexpected_response_error",
                    null,
                    "Unexpected server response."
                );
              } else {
                loadingErrorMessage = l10n.get(
                    "loading_error",
                    null,
                    "An error occurred while loading the PDF."
                );
              }

              loadingErrorMessage.then(function (msg) {
                self.error(msg, {message});
              });
              self.loadingBar.hide();
            }
        );
      },

      /**
       * Closes opened PDF document.
       * @returns {Promise} - Returns the promise, which is resolved when all
       *                      destruction is completed.
       */
      close() {
        const errorWrapper = document.getElementById("errorWrapper");
        errorWrapper.hidden = true;

        if (!this.pdfLoadingTask) {
          return Promise.resolve();
        }

        const promise = this.pdfLoadingTask.destroy();
        this.pdfLoadingTask = null;

        if (this.pdfDocument) {
          this.pdfDocument = null;

          this.pdfViewer.setDocument(null);
          this.pdfLinkService.setDocument(null, null);

          if (this.pdfHistory) {
            this.pdfHistory.reset();
          }
        }

        return promise;
      },

      get loadingBar() {
        const bar = document.getElementById("loadingBar");
        return pdfjsLib.shadow(
            this,
            "loadingBar",
            new pdfjsViewer.ProgressBar(bar)
        );
      },

      setTitleUsingUrl: function pdfViewSetTitleUsingUrl(url) {
        this.url = url;
        let title = pdfjsLib.getFilenameFromUrl(url) || url;
        try {
          title = decodeURIComponent(title);
        } catch {
          // decodeURIComponent may throw URIError,
          // fall back to using the unprocessed url in that case
        }
        this.setTitle(title);
      },

      setTitleUsingMetadata(pdfDocument) {
        const self = this;
        pdfDocument.getMetadata().then(function (data) {
          const info = data.info,
              metadata = data.metadata;
          self.documentInfo = info;
          self.metadata = metadata;

          // Provides some basic debug information
          console.log(
              "PDF " +
              pdfDocument.fingerprints[0] +
              " [" +
              info.PDFFormatVersion +
              " " +
              (info.Producer || "-").trim() +
              " / " +
              (info.Creator || "-").trim() +
              "]" +
              " (PDF.js: " +
              (pdfjsLib.version || "-") +
              ")"
          );

          let pdfTitle;
          if (metadata && metadata.has("dc:title")) {
            const title = metadata.get("dc:title");
            // Ghostscript sometimes returns 'Untitled', so prevent setting the
            // title to 'Untitled.
            if (title !== "Untitled") {
              pdfTitle = title;
            }
          }

          if (!pdfTitle && info && info.Title) {
            pdfTitle = info.Title;
          }

          if (pdfTitle) {
            self.setTitle(pdfTitle + " - " + document.title);
          }
        });
      },

      setTitle: function pdfViewSetTitle(title) {
        document.title = title;
        // document.getElementById("title").textContent = title;
      },

      error: function pdfViewError(message, moreInfo) {
        const l10n = this.l10n;
        const moreInfoText = [
          l10n.get(
              "error_version_info",
              {version: pdfjsLib.version || "?", build: pdfjsLib.build || "?"},
              "PDF.js v{{version}} (build: {{build}})"
          ),
        ];

        if (moreInfo) {
          moreInfoText.push(
              l10n.get(
                  "error_message",
                  {message: moreInfo.message},
                  "Message: {{message}}"
              )
          );
          if (moreInfo.stack) {
            moreInfoText.push(
                l10n.get("error_stack", {stack: moreInfo.stack}, "Stack: {{stack}}")
            );
          } else {
            if (moreInfo.filename) {
              moreInfoText.push(
                  l10n.get(
                      "error_file",
                      {file: moreInfo.filename},
                      "File: {{file}}"
                  )
              );
            }
            if (moreInfo.lineNumber) {
              moreInfoText.push(
                  l10n.get(
                      "error_line",
                      {line: moreInfo.lineNumber},
                      "Line: {{line}}"
                  )
              );
            }
          }
        }

        const errorWrapper = document.getElementById("errorWrapper");
        errorWrapper.hidden = false;

        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = message;

        const closeButton = document.getElementById("errorClose");
        closeButton.onclick = function () {
          errorWrapper.hidden = true;
        };

        const errorMoreInfo = document.getElementById("errorMoreInfo");
        const moreInfoButton = document.getElementById("errorShowMore");
        const lessInfoButton = document.getElementById("errorShowLess");
        moreInfoButton.onclick = function () {
          errorMoreInfo.hidden = false;
          moreInfoButton.hidden = true;
          lessInfoButton.hidden = false;
          errorMoreInfo.style.height = errorMoreInfo.scrollHeight + "px";
        };
        lessInfoButton.onclick = function () {
          errorMoreInfo.hidden = true;
          moreInfoButton.hidden = false;
          lessInfoButton.hidden = true;
        };
        moreInfoButton.hidden = false;
        lessInfoButton.hidden = true;
        Promise.all(moreInfoText).then(function (parts) {
          errorMoreInfo.value = parts.join("\n");
        });
      },

      progress: function pdfViewProgress(level) {
        const percent = Math.round(level * 100);
        // Updating the bar if value increases.
        if (percent > this.loadingBar.percent || isNaN(percent)) {
          this.loadingBar.percent = percent;
        }
      },

      get pagesCount() {
        return this.pdfDocument.numPages;
      },

      get page() {
        return this.pdfViewer.currentPageNumber;
      },

      set page(val) {
        this.pdfViewer.currentPageNumber = val;
      },
      //放大
      zoomIn: function pdfViewZoomIn(ticks) {
        let newScale = this.pdfViewer.currentScale;
        console.log(newScale,'--放大前--')
        if(newScale < MAX_SCALE){
          newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
          newScale = Math.ceil(newScale * 10) / 10;
          newScale = Math.min(MAX_SCALE, newScale);
        }
        // this.pdfViewer.currentScaleValue = newScale;
        this.pdfViewer.currentScale = newScale;
        console.log(this.pdfViewer.currentScaleValue,'--放大后--')
      },

      zoomOut: function pdfViewZoomOut(ticks) {
        let newScale = this.pdfViewer.currentScale;
        if(newScale > MIN_SCALE){
          newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
          newScale = Math.floor(newScale * 10) / 10;
          newScale = Math.max(MIN_SCALE, newScale);
        }
        // this.pdfViewer.currentScaleValue = newScale;
        this.pdfViewer.currentScale = newScale;
      },

      initUI: function pdfViewInitUI() {
        const eventBus = new pdfjsViewer.EventBus();
        this.eventBus = eventBus;

        const linkService = new pdfjsViewer.PDFLinkService({
          eventBus,
        });
        this.pdfLinkService = linkService;

        this.l10n = pdfjsViewer.NullL10n;

        const container = document.getElementById("viewerContainer");
        const pdfViewer = new pdfjsViewer.PDFViewer({
          container,
          eventBus,
          linkService,
          l10n: this.l10n,
          useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
          textLayerMode: TEXT_LAYER_MODE,
        });
        this.pdfViewer = pdfViewer;
        linkService.setViewer(pdfViewer);

        this.pdfHistory = new pdfjsViewer.PDFHistory({
          eventBus,
          linkService,
        });
        linkService.setHistory(this.pdfHistory);

        document.getElementById("previous").addEventListener("click", function () {
          PDFViewerApplication.page--;
        });

        document.getElementById("next").addEventListener("click", function () {
          PDFViewerApplication.page++;
        });

        document.getElementById("zoomIn").addEventListener("click", function () {
          PDFViewerApplication.zoomIn();
        });

        document.getElementById("zoomOut").addEventListener("click", function () {
          PDFViewerApplication.zoomOut();
        });

        document
            .getElementById("pageNumber")
            .addEventListener("click", function () {
              this.select();
            });

        document
            .getElementById("pageNumber")
            .addEventListener("change", function () {
              PDFViewerApplication.page = this.value | 0;
              if (this.value !== PDFViewerApplication.page.toString()) {
                this.value = PDFViewerApplication.page;
              }
            });

        eventBus.on("pagesinit", function () {
          // We can use pdfViewer now, e.g. let's change default scale.
          pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
        });

        eventBus.on(
            "pagechanging",
            function (evt) {
              const page = evt.pageNumber;
              const numPages = PDFViewerApplication.pagesCount;
              document.getElementById("pageNumber").value = page;
              document.getElementById("previous").disabled = page <= 1;
              document.getElementById("next").disabled = page >= numPages;
            },
            true
        );
      },
    };
    window.PDFViewerApplication = PDFViewerApplication;

    // default width , hetght
    let signwidth = 50
    let signheight = 30
    //personal
    const personalImgW = 120
    const personalImgH = 50
    //scale size
    const personalImgWScale = ref(0)
    const personalImgHScale = ref(0)
    //public
    const publicImgW = 120
    const publicImgH = 120
    let publicImgWScale = ref(0)
    let publicImgHScale = ref(0)
    /**
     * set the sizes of signs
     * */
    function setSignSize(){
      let scale = scaleReal.value
      personalImgWScale.value = parseFloat(personalImgW * scale)
      personalImgHScale.value = parseFloat(personalImgH * scale)
      publicImgWScale.value = parseFloat(publicImgW * scale)
      publicImgHScale.value = parseFloat(publicImgH * scale)
    }
    /**
     *  delete the sign and children signs, the del btn toggle
     *  */
    const delMenu = ()=>{
      isDel.value = !isDel.value
      $('.sign[data-first=1]').each(function(){
        let auth = $(this).data('auth')
        if(auth==1){
          let str = isDel.value?'block':'none'
          $(this).find('.del-btn').css('display',str).unbind('click').bind('click',function(){
            let uid = $(this).parent().data('uniqueid')
            $('.sign[data-uniqueid='+uid+']').remove()
          })

        }
      })
    }

    /**
     * drag the sign to pdf , bind moving event , the lock to prevent repeat creating
     * */
    const isCanClick = ref(1)
    const bindMove = ()=>{
      $('.touch-el').on('touchstart',function(e){
        e.preventDefault()
        if(!isCanClick.value){ return }
        isCanClick.value = false
        let page = PDFViewerApplication.page
        let cloneDom = $(this).clone()
        let uniqueid = new Date().valueOf()
        $(cloneDom).attr('data-uniqueid',uniqueid)
        $(cloneDom).attr('data-first',1)
        $(cloneDom).data('uniqueid',uniqueid)
        $(cloneDom).data('auth',1)
        $(cloneDom).removeClass('touch-el')
        let offset = $('#viewer > .page[data-page-number="'+page+'"]').offset()
        let pageLeft = offset.left
        let pageTop = offset.top
        let startX = e.originalEvent.targetTouches[0].pageX
        let startY = e.originalEvent.targetTouches[0].pageY
        let pageWith =  $('#viewer > .page[data-page-number="'+page+'"]').width()
        let pageHeight =  $('#viewer > .page[data-page-number="'+page+'"]').height()
        $(cloneDom).addClass('sign-one-add')
        $(cloneDom).addClass('sign-first')
        $(cloneDom).data('page',page)
        $(cloneDom).data('id','')
        let orgSealId = $(cloneDom).attr('data-signid')
        $(cloneDom).data('orgSealId',orgSealId)
        $(cloneDom).data('ruleType',3)
        $(cloneDom).data('rule',page)
        let t = $(cloneDom).data('type')
        if(t==1){
          signwidth = personalImgWScale.value
          signheight = personalImgHScale.value
        }else{
          signwidth = publicImgWScale.value
          signheight = publicImgHScale.value
        }
        $(cloneDom).on("click",e=>handleClick_db(e,signDbClick))
        $(document).on('touchmove',function(ev){
          let x= ev.originalEvent.targetTouches[0].pageX
          let y= ev.originalEvent.targetTouches[0].pageY
          let left = x - pageLeft - signwidth/2
          let top = y - pageTop - signheight/2
          //area limit
          if(left < 0){
            left = 0
          }else if(left > pageWith-signwidth){
            left = pageWith - signwidth
          }
          if(top<0){
            top = 0
          }else if(top > pageHeight - signheight){
            top = pageHeight - signheight
          }

          $(cloneDom).css({position:'absolute',top:top+'px',left:left+'px'})
          $('#viewer > .page[data-page-number="'+page+'"]').append(cloneDom)
          //生成dom 绑定事件
          touch_move(pageWith,pageHeight)
        })
        $(document).on('touchend',function(){
          $(document).off('touchmove')
          isCanClick.value = true
        })
      })
    }

    /**
     *@des touchmove
     *@param pageWith is the width of pdf
     */
    function touch_move(pageWith,pageHeight,className='sign-one-add'){
      $('.'+className).on('touchstart',function(e){
        let auth = $(this).data('auth')
        if(auth==0||isCanDo.value==0){
          return
        }
        let uniqueid = $(this).data('uniqueid')
        let startLeft = $(this).position().left
        let startTop = $(this).position().top
        let startx = e.originalEvent.targetTouches[0].pageX
        let starty = e.originalEvent.targetTouches[0].pageY
        let sumX = startx - startLeft
        let sumY = starty - startTop
        let that = $(this)
        let t = $(this).data('type')
        if(t==1){
          //personal
          signwidth = personalImgWScale.value
          signheight = personalImgHScale.value
        }else{
          //公章
          signwidth = publicImgWScale.value
          signheight = publicImgHScale.value
        }
        $(this).on('touchmove',function(ev){
          let x = ev.originalEvent.targetTouches[0].pageX
          let y = ev.originalEvent.targetTouches[0].pageY
          let left = x - sumX
          let top = y - sumY
          if(left < 0){
            left = 0
          }else if(left > pageWith-signwidth){
            left = pageWith - signwidth
          }
          if(top<0){
            top = 0
          }else if(top > pageHeight - signheight){
            top = pageHeight - signheight
          }
          $(that).css({top:top+'px',left:left+'px'})
          ev.preventDefault()
          moveByFirst(uniqueid,left,top)
        })
        // $(this).on('touchend',function(){
        //     $(this).off('touchmove')
        // })
      })
    }
    /**
     * move by first
     * */
    const moveByFirst = (uniqueId,x,y) =>{
      let doms = document.querySelectorAll("[data-uniqueid='"+uniqueId+"'][data-first='2']")
      for(let item of doms){
        item.style.left = x +"px"
        item.style.top = y + "px"
      }
    }

    /**
     *  watch click event to start double click
     * */
    let isWaiting = false
    let timer_db
    const handleClick_db =(evt,callback=()=>{})=>{
      evt.stopPropagation();
      if(timer_db){
        clearTimeout(timer_db)
        timer_db = null
      }
      if(isWaiting){
        isWaiting = false
        callback(evt)
      }else{
        isWaiting = true
        timer_db = setTimeout(function(){
          isWaiting = false
        },300)
      }
    }

    /**
     * the callback of double click
     * */
    const currentSignDom = ref('')
    const signDbClick = (e)=>{
      cancelMore()
      let dom = e.currentTarget
      let auth = $(dom).data('auth')
      if(auth!=1){
        showToast('无权限')
        return
      }
      currentSignDom.value = dom
      show.value = true
      form.value.ruleType = $(dom).data('ruleType')
      form.value.rule = $(dom).data('rule')
    }

    /**
     * validate input rule
     * */
    const validateFree = (value) => {
      if (form.value.ruleType == 1) {
        return true
      }
      if (!value) {
        showToast("页码不能为空")
        return false
      }
      if(/^\d+$/.test(value)){
        if(value>allPages.value){
          showToast("不能大于总页码数")
          return false
        }
      }
      if(allPages.value == 1 && value!=1){
         showToast("目前只有一页、页码请输入1")
        return false
      }

      let rules = /^((\d+-\d+,)|(\d+,))*((\d+-\d+)|\d+)$/
      if (!rules.test(value)) {
        showToast("请按规则输入")
        return false
      } else if(!checkRule(value)) {
        showToast("请检查是否有页码重复、区间开始数字大于等于结束数字、或者存在0页码、是否有页码大于总页码数")
        return false
      }
      return true
    };
    const checkRule = (str)=>{
      let pages= []
      let arrs = str.split(",")
      let isGo = true
      arrs.forEach(it=>{
        let reg = /-/
        if(reg.test(it)){
          let [a,b] = it.split("-")
          let start = parseInt(a)
          let end = parseInt(b)
          if(start >= end){
            isGo = false
          }else {
            if(isGo){
              for(let i=start;i<=end;i++){
                if(i==0||i>allPages.value){
                  isGo = false
                }
                pages.push(i)
              }
            }
          }
        }else{
          if(it==0||it>allPages.value){
            isGo = false
          }
          pages.push(parseInt(it))
        }
      })

      if(!isGo){
        return false
      }
      if((new Set(pages)).size != pages.length){
        return false
      }
      return true
    }
    /**
     * 批量创建，确定操作前触发检测
     * */
    const  check_result = ref(0)
    const checkMore = (action)=>{
      if(action == 'confirm'){
        return check_result.value
      }else{
        return true
      }
    }

    /**
     *  create signs by page's rule
     */
    const createMore = ()=>{
      check_result.value = validateFree(form.value.rule)
      if(!check_result.value){
        return
      }
      let scale = scaleReal.value
      let dom = currentSignDom.value
      let id =''
      let top = $(dom).css('top').replace(/px/ig,'')
      let left = $(dom).css('left').replace(/px/ig,'')
      let orgSealId = $(dom).data('orgSealId')
      let ruleType = form.value.ruleType
      let rule = form.value.rule
      if(ruleType==1){
        rule = ''
      }
      let auth = 1
      let type = $(dom).data('type')
      let uniqueId = new Date().getTime()
      let path = $(dom).find('img').attr('src')
      if($(dom).hasClass('sign-one-add')){
      }else{
        id = $(dom).data('id')
      }
      let arr = [{id,top:(top/scale).toFixed(3),left:(left/scale).toFixed(3),orgSealId,ruleType,rule,auth,type,uniqueId,path}]
      beforeCreateDom(arr)
      let uid = $(dom).data('uniqueid')
      $('.sign[data-uniqueid='+uid+']').remove()
    }
    const cancelMore = ()=>{
        form.value = {
          ruleType:''
          ,rule:''
        }
    }
    /**
     * save data
     * includes add or history
     * */
    const save = () =>{
      let arr= []
      let scale = scaleReal.value;
      $('.sign-first[data-first=1]').each(function(key,val){
        let top = parseFloat(val.style.top.replace(/px/ig,''))/scale
        let left =parseFloat(val.style.left.replace(/px/ig,''))/scale
        let id = $(val).data('id')
        let orgSealId = $(val).data('orgSealId')
        let pageNum = $(val).data('page')
        let uniqueid = $(val).data('uniqueid')
        let ruleType = $(val).data('ruleType')
        let rule = $(val).data('rule')
        arr.push({coordinateY:top.toFixed(3),coordinateX:left.toFixed(3),orgSealId,pageNum,id,ruleType,rule,uniqueId:uniqueid})
      })
      let data = {
        signInfoDetailDTOList:arr,
        signInfoId:pdfId.value
      }
      loading.value = true
      let submitApi = signT==0 ? saveSealApi : repairSealApi
      submitApi(data).then(res=>{
        loading.value = false
        if(res.code==0){
          showToast('签章数据保存成功')

          // 小程序返回两次问题
          wx.miniProgram.getEnv(res => {
            // 如果小程序中打开
            if (res.miniprogram) {
              history.pushState({ page: 1 }, null, window.location.href);
              // 监听popstate事件
              window.addEventListener('popstate', (event) => {
                wx.miniProgram.navigateBack();
              });
            }
          })
        }else{
          showToast(res?.msg||'接口异常')
        }
      }).catch(err=>{
        loading.value = false
        console.log(err,'--error--')
        let str = err.toString()
        str = str.replace("Error: ",'')
        str = JSON.parse(str)
        showToast(str?.msg||'保存失败')

      })
    }

    const beforeCreateDom =(arr=[])=>{
      for(let it of arr){
        if(it.rule==0){
          for (let i = 0; i < allPages.value; i++) {
            if (i == 0) {
              createDom(it,i+1,1)
            } else {
              createDom(it,i+1,2)
            }
          }
        }else if(/(,|-)/ig.test(it.rule)){
          let str = it.rule
          let pages = getPagesByRule(str) //页码
          let pagesNoRep = [] //去重后页码
          if (arrHasRepeat(pages)) {
            pagesNoRep = [...new Set(pages)]
          } else {
            pagesNoRep = pages
          }
          pagesNoRep && pagesNoRep.forEach((p,i) => {
            if (i==0) {
              createDom(it,p,1)
            } else {
              createDom(it,p,2)
            }
          })
        }else if(/^\d+/ig.test(it.rule)){ //单页
          createDom(it,it.rule,1)
        }
      }
    }

    /**
     * review sign by history data
     * */
    function reviewSign(){
      let arr = signData.value
      if(arr.length==0){
        return
      }
      beforeCreateDom(arr)
    }
    /**
     * create signs in the current page
     * @param first  use it to distinguish the level of sign
     * */
    const createDom = (it,toPage,first=1)=>{
      let scale = scaleReal.value
      let pageWith =  $('#viewer > .page[data-page-number="'+toPage+'"]').width()
      let pageHeight =  $('#viewer > .page[data-page-number="'+toPage+'"]').height()
      let dom
      if(it.type==1){
        dom = $('.sign-one-copy').clone()
      }else{
        dom = $('.sign-public-copy').clone()
      }
      $(dom).find('img').attr('src',it.path)
      let width = it.type==1 ? personalImgWScale.value +'px' : publicImgWScale.value +'px'
      let height = it.type==1 ? personalImgHScale.value +'px': publicImgHScale.value +'px'
      $(dom).css({position:'absolute',top:it.top*scale+'px',left:it.left*scale+'px',display:'block',width,height})
      $(dom).data('page',it.page)
      $(dom).data('uniqueid',it.uniqueId)
      $(dom).data('id',it.id)
      $(dom).data('ruleType',it.ruleType)
      $(dom).data('rule',it.rule)
      $(dom).data('type',it.type)
      $(dom).data('orgSealId',it.orgSealId)
      $(dom).data('first',first)
      $(dom).attr('data-first',first)

      $(dom).attr('data-uniqueid',it.uniqueId) //查询使用
      $(dom).attr('data-page',it.page)
      $(dom).removeClass('sign-one-copy')
      $(dom).removeClass('sign-public-copy')
      $(dom).find('img').attr('src',it.wxImgPath)
      if(first==1){
        $(dom).addClass('sign-first')
        $(dom).data('auth',it.auth)
      }else{
        $(dom).data('auth',0)
      }
      $('#viewer > .page[data-page-number="'+toPage+'"]').append(dom)
      if(first==1){
        $(dom).on("click",e=>handleClick_db(e,signDbClick))
        touch_move(pageWith,pageHeight,'sign-first')
      }
    }


    /**
     * get array of pages by rule
     * @param str , which is the rule , resove it to get the pages
     * */
    const getPagesByRule = (str)=> {
      let pagesAll = []
      let arr = str.split(",").filter(it => {
        return it != ""
      })
      let rule =/-/
      arr.forEach(it=>{
        let isMore = rule.test(it)
        if(isMore){
          let [a,b] = it.split("-")
          let start = parseInt(a)
          let end = parseInt(b)
          for(let i=start;i<=end;i++){
            pagesAll.push(i)
          }
        }else{
          pagesAll.push(parseInt(it))
        }
      })
      pagesAll.sort(function(a,b){return a-b})
      return pagesAll
    }
    /**
     * check repeat page
     * return true 有重复元素
     * */
    const arrHasRepeat = (arr)=>{
      if(new Set(arr).size != arr.length){
        return true
      }
      return false
    }
    /**
     *  get signature data
     *  */
    const sealList = ref([])
    const getSigns = ()=>{
      let projectIdVal = projectId.value
      getSealsApi(projectIdVal).then(res=>{
        sealList.value = res.data.map(it=>{
          return {id:it.id,sealType:it.sealType,sealImgPath:it.wxSealImgPath}
        })
      })
    }
    onMounted(()=>{
      getSigns()
    })

    /**
     * init to get the data of pdf and review signs , and load the pdf
     * */
    const pdfData =  ref()
    const getPdfData = () =>{
      loading.value = true
      getPdfInfoByIdApi(pdfId.value,signT).then(res=>{
        loading.value = false
        if(res.code==0){
          pdfData.value = res.data
          title.value = res.data?.modelName || ''
          // DEFAULT_URL = '/remotefile' + res.data.signFileUrl.substring(res.data.signFileUrl.indexOf('/upload'))
          DEFAULT_URL = res.data.wxSignFileUrl
          signData.value = res.data.signDetailBos && res.data.signDetailBos.map(it => {
            return {
              top: it.coordinateY,
              left: it.coordinateX,
              page: it.pageNum,
              orgSealId: it.orgSealId,//印章id
              ruleType: it.ruleType,// 1全部，2自定义，3单页
              rule: it.rule, // 克隆规则
              auth: it.signAuth,
              type: it.sealType, // 1个人 0公章
              id: it.id,
              ...it
            }
          })

          PDFViewerApplication.initUI();
          const animationStarted = new Promise(function (resolve) {
            window.requestAnimationFrame(resolve);
          });
          animationStarted.then(function () {
            PDFViewerApplication.open({
              url: DEFAULT_URL,
            }).then((res)=>{
              setTimeout(()=>{
                scaleReal.value = PDFViewerApplication.pdfViewer._pages[0].viewport.scale
                allPages.value = PDFViewerApplication.pdfViewer._pages.length
                setSignSize()
                if(signT==0){
                  reviewSign()
                }
              },1000)
            });
          });
        }
      }).catch(err=>{
        loading.value = false
      })
    }
    // watch the pdf to update data
    watch(pdfId,()=>{
      getPdfData()
    },{
      immediate:true
    })

</script>

<style lang="less" scoped>
.page-rule-read{
  width:100%;
  border-top:1px solid #c8c9cc;
  color: #409EFF;
  font-size: 1rem;
  padding:5px;
  &>div{
    margin-top:1rem;
  }
}
.left-too-bar {
  width:20%;
  height:90vh;
  position:fixed;
  top:50px;
  left:-200px;
  background: #fff;
  opacity: 1;
  z-index: 100;
  border-right: 1px solid #e5e1e1;
}
.tool-item {
  position: relative;
  height:130px;
  padding-top:10px;
}
.sign {
  height: 30px;
  width: 50px;
  overflow: hidden;
  position: absolute;
  right: 2px;
  //top: 10%;
  opacity: 1;
  z-index: 11;
}
.del-btn {
  position:absolute;
  top:-5px;
  right:0;
  font-size:30px;
  color: #006fff;
  display:none;
}
.tool-sign-text {
  font-size: 18px;
  margin-bottom: 10px;
  color:#000
}
.sign-img {
  width: 100%;
  height: 100%;
}
.sign img {
  width: 100%;
  height: 100%;
}

.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position:relative;
}
.sign-btn-open {
  color: #282828;
  font-size:20px;
  position:absolute;
  left:5px
}
.show-tool {
  display:block;
  animation:animationopen 1.5s;
  animation-fill-mode:forwards;
}
.hidden-tool {
  animation: animationclose 1.5s;
  animation-fill-mode:forwards;
}
@keyframes animationopen
{
  from {
    left:-200px
  }
  to {
    left:0
  }
}
@keyframes animationclose
{
  from {
    left:0
  }
  to {
    left:-200px
  }
}

.open-menu {
  color: #4095e8;
}
.toolbarButton.del {
  position: absolute;
  width: 18%;
  height: 100%;
  left: 63%;
  background-size: 2.4rem;
  color: #ffffff;
}
.toolbarButton.btn-sign {
  position: absolute;
  width: 18%;
  height: 100%;
  left: 45%;
  background-size: 2.4rem;
  color: #ffffff;
}

#title {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

}

.form-top {
  width:100%;
  height:50px;
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
  padding-left: 10px;
}
.form-center {
  margin-top: 10px;
}
</style>