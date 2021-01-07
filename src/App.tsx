import React, { useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import Modal from 'react-modal';

Modal.setAppElement("#root");

const workerSrc = './pdf.worker.min.js';
const pdfSrc = './c4611_sample_explain.pdf';

const RESOLUTION = 2;

export const App = () => {
  const [tab, setTab] = useState<"scroll" | "paging" | "modal">("scroll");
  return (
    <>
      <div>
        <button disabled={tab === "scroll"} onClick={() => setTab("scroll")}>Scroll</button>
        <button disabled={tab === "paging"} onClick={() => setTab("paging")}>Paging</button>
        <button disabled={tab === "modal"} onClick={() => setTab("modal")}>Modal</button>
      </div>
      <br />
      <div>
        {tab === "scroll" && <ScrollPdfViewer />}
        {tab === "paging" && <PagingPdfViewer />}
        {tab === "modal" && <ModalPdfViewer />}
      </div>
    </>
  )
}

export const ScrollPdfViewer = () => {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const fn = async () => {
      setPdf(await pdfjs.getDocument(pdfSrc).promise);
    }
    fn();
    return () => {
      setPdf(null);
    };
  }, [])

  useEffect(() => {
    if (!pdf) {
      return;
    }
    const fn = async () => {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = document.getElementById(`pdf-canvas-${i}`) as HTMLCanvasElement;
        const canvasContext = canvas.getContext('2d');

        const defaultViewport = page.getViewport({ scale: 1 });
        const viewport = {
          ...defaultViewport,
          // transform is not includes in params of pdfjs.PDFPageViewport, but this can be used to change pdf resolution
          transform: [RESOLUTION, 0, 0, -RESOLUTION, 0, defaultViewport.height * RESOLUTION],
        };
  
        canvas.width = viewport.width * RESOLUTION;
        canvas.height = viewport.height * RESOLUTION;
    
        const renderParams: pdfjs.PDFRenderParams = {
          canvasContext,
          viewport,
        };
        await page.render(renderParams).promise;
      }
    }
    fn();
  }, [pdf])

  if (!pdf) {
    return null;
  }

  return (
    <div className="pdf-canvas-wrapper" style={{ width: "100%", height: "80vh", overflow: "scroll" }}>
      {[...new Array(pdf.numPages)].map((_, i) => <canvas id={`pdf-canvas-${i + 1}`} style={{ width: "100%", border: "solid 1px black", boxSizing: "border-box" }} />)}
    </div>
  );
};

export const PagingPdfViewer = () => {
  const [pageNum, setPageNum] = useState(1);
  const [totalPageCount, setTotalPageCount] = useState(0);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const fn = async () => {
      const pdf = await pdfjs.getDocument(pdfSrc).promise;
      
      setTotalPageCount(pdf.numPages);

      const page = await pdf.getPage(pageNum);
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      const canvasContext = canvas.getContext('2d');

      const defaultViewport = page.getViewport({ scale: 1 });
      const viewport = {
        ...defaultViewport,
        transform: [RESOLUTION, 0, 0, -RESOLUTION, 0, defaultViewport.height * RESOLUTION],
      };

      canvas.width = viewport.width * RESOLUTION;
      canvas.height = viewport.height * RESOLUTION;
  
      const renderParams: pdfjs.PDFRenderParams = {
        canvasContext,
        viewport,
      };
      await page.render(renderParams).promise;
    }
    fn();
  }, [pageNum])

  const handleClick = (nextPageNum: number) => () => {
    if (nextPageNum <= 0 || nextPageNum > totalPageCount) {
      return;
    }
    setPageNum(nextPageNum);
  };

  if (totalPageCount === 0) {
    return null;
  }

  return (
    <div>
      <button onClick={handleClick(pageNum - 1)}>{"<"}</button>
      <button onClick={handleClick(pageNum + 1)}>{">"}</button>
      <br />
      <div className="pdf-canvas-wrapper" style={{ width: "100%", height: "80vh", overflow: "scroll" }}>
        <canvas id="pdf-canvas" style={{ width: "100%", border: "solid 1px black", boxSizing: "border-box" }} />
      </div>
    </div>
  );
};

const ModalPdfViewer = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <ScrollPdfViewer />
      </Modal>
    </div>
  );
}
