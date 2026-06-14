import './App.css'
import {useState, useRef, useEffect} from 'react'
import * as React from "react";

interface TextBox {
  id: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  vertical: boolean;
}

interface DragInfo {
  id: number;
  offsetX: number;
  offsetY: number;
}

function App() {
  const [texts, setTexts] = useState<TextBox[]>([
    { id: 0, text: '안녕하세요', x: 60,  y: 80,  fontSize: 24, vertical: false },
    { id: 1, text: 'Hello',      x: 300, y: 200, fontSize: 36, vertical: false },
    { id: 2, text: '파피에디터', x: 180, y: 370, fontSize: 20, vertical: false },
  ]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId,  setEditingId]  = useState<number | null>(null);

  const wrapRef = useRef<HTMLDivElement|null>(null);
  const boxRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const drag    = useRef<DragInfo | null>(null);


// 드래그
  const handleMove = (e: MouseEvent) => {
    if (!wrapRef.current || !drag.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const { id, offsetX, offsetY } = drag.current;

    const el = boxRefs.current.get(id);
    const bw = el?.offsetWidth ?? 0;
    const bh = el?.offsetHeight ?? 0;

    let x = e.clientX - r.left - offsetX;
    let y = e.clientY - r.top - offsetY;

    // 컨테이너(500×500) 안으로 제한
    x = Math.max(0, Math.min(x, r.width - bw));
    y = Math.max(0, Math.min(y, r.height - bh));

    setTexts(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  };

  const handleUp = () => {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleUp);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, t: TextBox) => {
    if (editingId === t.id) return;
    setSelectedId(t.id);
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    drag.current = { id: t.id, offsetX: e.clientX - r.left - t.x, offsetY: e.clientY - r.top - t.y };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

// 편집 완료
  const commitEdit = (id: number, raw: string | null) => {
    const val = (raw ?? '').trim();
    setTexts(prev => prev.map(t => t.id === id ? { ...t, text: val || t.text } : t));
    setEditingId(null);
  };

// 정렬
  const center = (axis: 'h' | 'v' | 'c') => {
    if (selectedId === null) return;
    const el = boxRefs.current.get(selectedId);
    if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    setTexts(prev => prev.map(t => t.id !== selectedId ? t : {
      ...t,
      x: axis !== 'v' ? (500 - w) / 2 : t.x,
      y: axis !== 'h' ? (500 - h) / 2 : t.y,
    }));
  };

// 가로 세로 변경
  const setVertical = (v: boolean) => {
    if (selectedId === null) return;
    setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, vertical: v } : t));
  };

  // 편집 시작 시 포커싱
  useEffect(() => {
    if (editingId === null) return;
    const el = boxRefs.current.get(editingId);
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }
  }, [editingId]);


  const sel = texts.find(t => t.id === selectedId);
  return (
      <>
        <h1>Canvas 텍스트 에디터</h1>

        <div className="wrap" ref={wrapRef}
             style={{ position:'relative', width:500, height:500 }}
             onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
               if (e.target === e.currentTarget) { setSelectedId(null); setEditingId(null); }
             }}>
          {texts.map((t) => (
              <div key={t.id}
                   ref={(el) => { if (el) boxRefs.current.set(t.id, el); }}
                   className={`text-box ${selectedId === t.id ? 'selected' : ''} ${editingId === t.id ? 'editing' : ''}`}
                   style={{
                     position:'absolute', left:t.x, top:t.y, fontSize:t.fontSize,
                     writingMode: t.vertical ? 'vertical-rl' : 'horizontal-tb',
                   }}
                   onMouseDown={(e) => handleMouseDown(e, t)}
                   onDoubleClick={() => setEditingId(t.id)}
                   contentEditable={editingId === t.id}
                   suppressContentEditableWarning
                   onBlur={(e: React.FocusEvent<HTMLDivElement>) => commitEdit(t.id, e.currentTarget.textContent)}
                   onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                     if (e.key === 'Enter')  { e.preventDefault(); e.currentTarget.blur(); }
                     if (e.key === 'Escape') { e.currentTarget.blur(); }
                   }}>
                {t.text}
              </div>
          ))}
        </div>

        <div className="toolbar">
          <div className="group">
            <button id="btnH" onClick={()=>center('h')}>수평 가운데</button>
            <button id="btnV" onClick={()=>center('v')}>수직 가운데</button>
            <button id="btnC" onClick={()=>center('c')}>전체 가운데</button>
          </div>
          <div className="divider"></div>
          <div className="group">
            <button id="btnHoriz"
                    className={!sel || !sel.vertical ? 'active' : ''}
                    onClick={() => setVertical(false)}>가로 쓰기</button>
            <button id="btnVert"
                    className={sel?.vertical ? 'active' : ''}
                    onClick={() => setVertical(true)}>세로 쓰기</button>
          </div>
        </div>

        <p className="hint">클릭 → 선택 &nbsp;|&nbsp; 더블클릭 → 텍스트 수정 &nbsp;|&nbsp; 드래그 → 이동 &nbsp;|&nbsp; Enter / Escape → 수정
          완료</p>
      </>
  )
}

export default App
