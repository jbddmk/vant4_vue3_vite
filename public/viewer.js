if (!pdfjsLib.getDocument || !pdfjsViewer.PDFViewer) {
    // eslint-disable-next-line no-alert
    alert("Please build the pdfjs-dist library using\n `gulp dist-install`");
}

const USE_ONLY_CSS_ZOOM = true;
const TEXT_LAYER_MODE = 0; // DISABLE
const MAX_IMAGE_SIZE = 1024 * 1024;
const CMAP_URL = "./pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs-dist/build/pdf.worker.js";

const DEFAULT_URL = "./test.pdf";
const DEFAULT_SCALE_DELTA = 1.1;
const MIN_SCALE = 0.25;
const MAX_SCALE = 10.0;
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
                // Document loaded, specifying document for the viewer.
                self.pdfDocument = pdfDocument;
                self.pdfViewer.setDocument(pdfDocument);
                self.pdfLinkService.setDocument(pdfDocument);
                self.pdfHistory.initialize({
                    fingerprint: pdfDocument.fingerprints[0],
                });

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
        document.getElementById("title").textContent = title;
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

    zoomIn: function pdfViewZoomIn(ticks) {
        let newScale = this.pdfViewer.currentScale;
        console.log(newScale,'--放大--')
        do {
            newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(MAX_SCALE, newScale);
        } while (--ticks && newScale < MAX_SCALE);
        this.pdfViewer.currentScaleValue = newScale;
    },

    zoomOut: function pdfViewZoomOut(ticks) {
        let newScale = this.pdfViewer.currentScale;
        do {
            newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(MIN_SCALE, newScale);
        } while (--ticks && newScale > MIN_SCALE);
        this.pdfViewer.currentScaleValue = newScale;
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

                // Ensure that the page number input displays the correct value,
                // even if the value entered by the user was invalid
                // (e.g. a floating point number).
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

document.addEventListener(
    "DOMContentLoaded",
    function () {
        PDFViewerApplication.initUI();
    },
    true
);

// The offsetParent is not set until the PDF.js iframe or object is visible;
// waiting for first animation.
const animationStarted = new Promise(function (resolve) {
    window.requestAnimationFrame(resolve);
});

// We need to delay opening until all HTML is loaded.
animationStarted.then(function () {
    PDFViewerApplication.open({
        url: DEFAULT_URL,
    }).then(()=>{
       setTimeout(()=>{
           reviewSign()
       },1000)
    });
});

//印章宽高
let signwidth = 50
let signheight = 30

$('.sign-one').on('touchstart',function(e){
    let page = PDFViewerApplication.page
    let cloneDom = $(this).parent().clone()
    let offset = $('#viewer > .page[data-page-number="'+page+'"]').offset()
    let pageLeft = offset.left
    let pageTop = offset.top
    let startX = e.originalEvent.targetTouches[0].pageX
    let startY = e.originalEvent.targetTouches[0].pageY
    let pageWith =  $('#viewer > .page[data-page-number="'+page+'"]').width()
    let pageHeight =  $('#viewer > .page[data-page-number="'+page+'"]').height()
    $(cloneDom).addClass('sign-one-add')
    $(cloneDom).data('page',page)
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
        touch_move(pageWith,pageHeight)
    })
    $(document).on('touchend',function(){
        $(document).off('touchmove')
    })
})

/**
 *@des touchmove
 *@param pageWith is the width of pdf
*/
function touch_move(pageWith,pageHeight,className='sign-one-add'){
    $('.'+className).on('touchstart',function(e){
        let startLeft = $(this).position().left
        let startTop = $(this).position().top
        let startx = e.originalEvent.targetTouches[0].pageX
        let starty = e.originalEvent.targetTouches[0].pageY
        let sumX = startx - startLeft
        let sumY = starty - startTop
        let that = $(this)
        $(this).on('touchmove',function(ev){
            let x = ev.originalEvent.targetTouches[0].pageX
            let y = ev.originalEvent.targetTouches[0].pageY
            let left = x - sumX
            let top = y - sumY
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
            $(that).css({top:top+'px',left:left+'px'})
            ev.preventDefault()
        })
        // $(this).on('touchend',function(){
        //     $(this).off('touchmove')
        // })
    })
}

function save(){
    let arr= []
    let scale = PDFViewerApplication.pdfViewer.currentScale;
    $('.sign-one-add').each(function(key,val){
        let top = parseFloat(val.style.top.replace(/px/ig,''))/scale
        let left =parseFloat(val.style.left.replace(/px/ig,''))/scale
        let type = val.getAttribute('data-type')
        let id = val.getAttribute('data-id')
        let page = $(val).data('page')
        arr.push({top:top,left:left,type:type,imgId:id,page:page})
    })
    console.log(arr,'--666--')
    localStorage.setItem('signData',JSON.stringify(arr))
}

$('#save').click(function(){
    save()
})

//复原
function reviewSign(){
    let arr = JSON.parse(localStorage.getItem('signData'))
    let scale = PDFViewerApplication.pdfViewer.currentScale;
    console.log(arr,'last data11')
    for(it of arr){
        if(it.type==1){ //个人
            let pageWith =  $('#viewer > .page[data-page-number="'+it.page+'"]').width()
            let pageHeight =  $('#viewer > .page[data-page-number="'+it.page+'"]').height()
            let dom = $('.sign-one-copy').clone()
            $(dom).find('img').attr('src','./images/sign-01.png')
            $(dom).css({position:'absolute',top:it.top*scale+'px',left:it.left*scale+'px',display:'block'})
            $(dom).data('page',it.page)
            $(dom).attr('data-page',it.page)
            $(dom).removeClass('sign-one-copy')
            $(dom).addClass('review-sign-one')
            $('#viewer > .page[data-page-number="'+it.page+'"]').append(dom)
            console.log($('#viewer > .page[data-page-number="'+it.page+'"]'),111)
            touch_move(pageWith,pageHeight,'review-sign-one')
        }
    }
}

