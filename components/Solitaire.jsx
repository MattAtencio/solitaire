"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createDeck, shuffleDeck, SUIT_SYMBOLS, SUIT_COLORS, RANK_VALUES, RANKS } from "@/data/cards";
import styles from "./Solitaire.module.css";

/* ─── Helpers ─── */
function canStackOnTableau(card, target) {
  if (!target) return card.rank === "K";
  return target.color !== card.color && target.value === card.value + 1;
}

function canStackOnFoundation(card, topCard, suit) {
  if (!topCard) return card.rank === "A";
  return card.suit === topCard.suit && card.value === topCard.value + 1;
}

function initGame() {
  const deck = shuffleDeck(createDeck());
  const tableau = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      tableau[col].push({
        ...deck[idx],
        faceUp: row === col,
      });
      idx++;
    }
  }
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
  return {
    tableau,
    foundations: [[], [], [], []],
    stock,
    waste: [],
    moves: 0,
    startTime: Date.now(),
  };
}

/* ─── Card Component ─── */
function Card({ card, style, onPointerDown, onClick, onDoubleClick, className = "", isDragging }) {
  if (!card.faceUp) {
    return (
      <div
        className={`${styles.card} ${styles.cardFaceDown} ${className}`}
        style={style}
        onClick={onClick}
      />
    );
  }

  const colorClass = card.color === "red" ? styles.cardRed : styles.cardBlack;

  return (
    <div
      className={`${styles.card} ${colorClass} ${className} ${isDragging ? styles.cardDragging : ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={styles.cardCorner}>
        <span className={styles.cardRank}>{card.rank}</span>
        <span className={styles.cardSuit}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      <span className={styles.cardCenter}>{SUIT_SYMBOLS[card.suit]}</span>
      <div className={`${styles.cardCorner} ${styles.cardBottomCorner}`}>
        <span className={styles.cardRank}>{card.rank}</span>
        <span className={styles.cardSuit}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function Solitaire() {
  const [game, setGame] = useState(initGame);
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHint, setShowHint] = useState(true);
  const dragRef = useRef(null);
  const containerRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const cardRefs = useRef({});

  // Timer
  useEffect(() => {
    if (won) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - game.startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [game.startTime, won]);

  // Hide hint after 8s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Check win
  useEffect(() => {
    const total = game.foundations.reduce((s, f) => s + f.length, 0);
    if (total === 52) setWon(true);
  }, [game.foundations]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  /* ─── Save state for undo ─── */
  const pushHistory = useCallback((g) => {
    setHistory((h) => [...h.slice(-30), JSON.parse(JSON.stringify(g))]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      prev.startTime = game.startTime; // keep original timer
      setGame(prev);
      return h.slice(0, -1);
    });
  }, [game.startTime]);

  /* ─── Deal from stock ─── */
  const dealStock = useCallback(() => {
    setGame((g) => {
      pushHistory(g);
      if (g.stock.length === 0) {
        // recycle waste back to stock
        return {
          ...g,
          stock: g.waste.map((c) => ({ ...c, faceUp: false })).reverse(),
          waste: [],
          moves: g.moves + 1,
        };
      }
      const card = { ...g.stock[g.stock.length - 1], faceUp: true };
      return {
        ...g,
        stock: g.stock.slice(0, -1),
        waste: [...g.waste, card],
        moves: g.moves + 1,
      };
    });
  }, [pushHistory]);

  /* ─── Try auto-move to foundation ─── */
  const tryAutoFoundation = useCallback(
    (cardId) => {
      setGame((g) => {
        // find the card
        let card = null;
        let source = null;
        let sourceIdx = -1;

        // check waste
        if (g.waste.length > 0 && g.waste[g.waste.length - 1].id === cardId) {
          card = g.waste[g.waste.length - 1];
          source = "waste";
        }

        // check tableau tops
        if (!card) {
          for (let i = 0; i < 7; i++) {
            const col = g.tableau[i];
            if (col.length > 0 && col[col.length - 1].id === cardId && col[col.length - 1].faceUp) {
              card = col[col.length - 1];
              source = "tableau";
              sourceIdx = i;
              break;
            }
          }
        }

        if (!card) return g;

        // find matching foundation
        for (let fi = 0; fi < 4; fi++) {
          const found = g.foundations[fi];
          const top = found.length > 0 ? found[found.length - 1] : null;
          if (canStackOnFoundation(card, top, null)) {
            pushHistory(g);
            const newFoundations = g.foundations.map((f, i) =>
              i === fi ? [...f, { ...card }] : f
            );

            let newWaste = g.waste;
            let newTableau = g.tableau;

            if (source === "waste") {
              newWaste = g.waste.slice(0, -1);
            } else {
              newTableau = g.tableau.map((col, i) => {
                if (i !== sourceIdx) return col;
                const newCol = col.slice(0, -1);
                if (newCol.length > 0 && !newCol[newCol.length - 1].faceUp) {
                  newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], faceUp: true };
                }
                return newCol;
              });
            }

            return {
              ...g,
              foundations: newFoundations,
              waste: newWaste,
              tableau: newTableau,
              moves: g.moves + 1,
            };
          }
        }
        return g;
      });
    },
    [pushHistory]
  );

  /* ─── Drag and Drop ─── */
  const getCardOffset = (colIdx) => {
    // Calculate visible offset for stacked tableau cards
    return 18; // % of card height
  };

  const handlePointerDown = useCallback(
    (e, source, sourceIdx, cardIndex) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const contRect = containerRef.current.getBoundingClientRect();

      // Gather cards being dragged (from cardIndex to end of pile)
      let cards = [];
      if (source === "tableau") {
        cards = game.tableau[sourceIdx].slice(cardIndex);
      } else if (source === "waste") {
        cards = [game.waste[game.waste.length - 1]];
      } else if (source === "foundation") {
        cards = [game.foundations[sourceIdx][game.foundations[sourceIdx].length - 1]];
      }

      if (cards.length === 0 || !cards[0].faceUp) return;

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      dragRef.current = {
        cards,
        source,
        sourceIdx,
        cardIndex,
        offsetX,
        offsetY,
        startX: e.clientX,
        startY: e.clientY,
        el,
        cardWidth: rect.width,
        cardHeight: rect.height,
        moved: false,
      };

      setDragState({
        cards,
        source,
        sourceIdx,
        cardIndex,
        x: rect.left - contRect.left,
        y: rect.top - contRect.top,
      });

      const onMove = (ev) => {
        const d = dragRef.current;
        if (!d) return;

        const dx = ev.clientX - d.startX;
        const dy = ev.clientY - d.startY;

        if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        d.moved = true;

        const cx = ev.clientX - d.offsetX - contRect.left;
        const cy = ev.clientY - d.offsetY - contRect.top;

        setDragState((s) => (s ? { ...s, x: cx, y: cy } : null));
      };

      const onUp = (ev) => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);

        const d = dragRef.current;
        if (!d) {
          setDragState(null);
          dragRef.current = null;
          return;
        }

        if (!d.moved) {
          setDragState(null);
          dragRef.current = null;
          return;
        }

        // Find drop target
        const dropX = ev.clientX;
        const dropY = ev.clientY;

        let dropped = false;

        setGame((g) => {
          // Check foundation drops
          for (let fi = 0; fi < 4; fi++) {
            const slotEl = document.querySelector(`[data-foundation="${fi}"]`);
            if (!slotEl) continue;
            const r = slotEl.getBoundingClientRect();
            if (dropX >= r.left && dropX <= r.right && dropY >= r.top && dropY <= r.bottom) {
              if (d.cards.length === 1) {
                const card = d.cards[0];
                const top =
                  g.foundations[fi].length > 0
                    ? g.foundations[fi][g.foundations[fi].length - 1]
                    : null;
                if (canStackOnFoundation(card, top)) {
                  pushHistory(g);
                  dropped = true;
                  return applyDrop(g, d, "foundation", fi);
                }
              }
              break;
            }
          }

          // Check tableau drops
          for (let ci = 0; ci < 7; ci++) {
            const colEl = document.querySelector(`[data-column="${ci}"]`);
            if (!colEl) continue;
            const r = colEl.getBoundingClientRect();
            if (dropX >= r.left && dropX <= r.right && dropY >= r.top && dropY <= r.bottom) {
              const col = g.tableau[ci];
              const topCard = col.length > 0 ? col[col.length - 1] : null;
              if (topCard && !topCard.faceUp) break;
              if (canStackOnTableau(d.cards[0], topCard)) {
                pushHistory(g);
                dropped = true;
                return applyDrop(g, d, "tableau", ci);
              }
              break;
            }
          }

          return g;
        });

        setDragState(null);
        dragRef.current = null;
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [game, pushHistory]
  );

  function applyDrop(g, d, destType, destIdx) {
    let newTableau = g.tableau.map((c) => [...c]);
    let newWaste = [...g.waste];
    let newFoundations = g.foundations.map((f) => [...f]);

    // Remove from source
    if (d.source === "tableau") {
      newTableau[d.sourceIdx] = newTableau[d.sourceIdx].slice(0, d.cardIndex);
      // Flip new top card
      const col = newTableau[d.sourceIdx];
      if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
      }
    } else if (d.source === "waste") {
      newWaste = newWaste.slice(0, -1);
    } else if (d.source === "foundation") {
      newFoundations[d.sourceIdx] = newFoundations[d.sourceIdx].slice(0, -1);
    }

    // Add to destination
    if (destType === "foundation") {
      newFoundations[destIdx] = [...newFoundations[destIdx], ...d.cards];
    } else {
      newTableau[destIdx] = [...newTableau[destIdx], ...d.cards.map((c) => ({ ...c, faceUp: true }))];
    }

    return {
      ...g,
      tableau: newTableau,
      waste: newWaste,
      foundations: newFoundations,
      moves: g.moves + 1,
    };
  }

  /* ─── Auto-complete (when all cards face up) ─── */
  const canAutoComplete = useCallback(() => {
    if (game.stock.length > 0 || game.waste.length > 0) return false;
    return game.tableau.every((col) => col.every((c) => c.faceUp));
  }, [game]);

  const autoComplete = useCallback(() => {
    const run = () => {
      setGame((g) => {
        let moved = false;
        let newG = { ...g, tableau: g.tableau.map((c) => [...c]), foundations: g.foundations.map((f) => [...f]) };

        for (let ci = 0; ci < 7; ci++) {
          const col = newG.tableau[ci];
          if (col.length === 0) continue;
          const card = col[col.length - 1];
          for (let fi = 0; fi < 4; fi++) {
            const top = newG.foundations[fi].length > 0 ? newG.foundations[fi][newG.foundations[fi].length - 1] : null;
            if (canStackOnFoundation(card, top)) {
              newG.foundations[fi] = [...newG.foundations[fi], card];
              newG.tableau[ci] = col.slice(0, -1);
              newG.moves = newG.moves + 1;
              moved = true;
              break;
            }
          }
          if (moved) break;
        }

        if (moved) {
          setTimeout(run, 80);
        }
        return newG;
      });
    };
    run();
  }, []);

  /* ─── New Game ─── */
  const newGame = useCallback(() => {
    setGame(initGame());
    setWon(false);
    setHistory([]);
    setElapsed(0);
  }, []);

  /* ─── Render ─── */
  const renderCard = (card, style, source, sourceIdx, cardIndex, isTop = false) => {
    return (
      <Card
        key={card.id}
        card={card}
        style={style}
        className={
          dragState &&
          dragState.source === source &&
          dragState.sourceIdx === sourceIdx &&
          dragState.cardIndex <= cardIndex &&
          dragState.cards.find((c) => c.id === card.id)
            ? styles.cardDragging
            : ""
        }
        isDragging={false}
        onPointerDown={
          card.faceUp
            ? (e) => handlePointerDown(e, source, sourceIdx, cardIndex)
            : undefined
        }
        onDoubleClick={
          card.faceUp && isTop ? () => tryAutoFoundation(card.id) : undefined
        }
      />
    );
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Solitaire</span>
        <div className={styles.stats}>
          <span className={styles.stat}>
            Moves: <span className={styles.statVal}>{game.moves}</span>
          </span>
          <span className={styles.stat}>
            Time: <span className={styles.statVal}>{formatTime(elapsed)}</span>
          </span>
        </div>
        <div className={styles.headerButtons}>
          <button
            className={styles.undoBtn}
            onClick={undo}
            disabled={history.length === 0}
          >
            Undo
          </button>
          <button className={styles.headerBtn} onClick={newGame}>
            New
          </button>
        </div>
      </div>

      {/* Top Row */}
      <div className={styles.topRow}>
        <div className={styles.stockWaste}>
          {/* Stock */}
          <div
            className={`${styles.slot} ${styles.stockSlot}`}
            onClick={dealStock}
          >
            {game.stock.length > 0 ? (
              <Card
                card={game.stock[game.stock.length - 1]}
                style={{ position: "relative" }}
                className={styles.cardStatic}
              />
            ) : (
              <span className={styles.slotLabel}>&#x21bb;</span>
            )}
          </div>

          {/* Waste */}
          <div className={styles.slot}>
            {game.waste.length > 0 ? (
              <div className={styles.wasteContainer}>
                {renderCard(
                  game.waste[game.waste.length - 1],
                  { position: "relative", top: 0, left: 0 },
                  "waste",
                  0,
                  game.waste.length - 1,
                  true
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Gap column */}
        <div />

        {/* Foundations */}
        <div className={styles.foundations}>
          {game.foundations.map((found, fi) => (
            <div
              key={fi}
              className={styles.foundationSlot}
              data-foundation={fi}
            >
              {found.length > 0 ? (
                renderCard(
                  found[found.length - 1],
                  { position: "relative", top: 0, left: 0 },
                  "foundation",
                  fi,
                  found.length - 1,
                  true
                )
              ) : (
                <span className={styles.foundationLabel}>
                  {["A", "A", "A", "A"][fi]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className={styles.tableau}>
        {game.tableau.map((col, ci) => (
          <div
            key={ci}
            className={styles.column}
            data-column={ci}
          >
            {col.length === 0 ? (
              <div className={styles.slot}>
                <span className={styles.slotLabel}>K</span>
              </div>
            ) : (
              col.map((card, ri) => {
                const offset = ri * (card.faceUp ? 18 : 8);
                return renderCard(
                  card,
                  { top: `${offset}%`, zIndex: ri },
                  "tableau",
                  ci,
                  ri,
                  ri === col.length - 1
                );
              })
            )}
          </div>
        ))}
      </div>

      {/* Drag ghost */}
      {dragState && dragRef.current?.moved && (
        <div
          style={{
            position: "absolute",
            left: dragState.x,
            top: dragState.y,
            width: dragRef.current.cardWidth,
            zIndex: 1001,
            pointerEvents: "none",
          }}
        >
          {dragState.cards.map((card, i) => (
            <Card
              key={card.id}
              card={{ ...card, faceUp: true }}
              style={{
                position: i === 0 ? "relative" : "absolute",
                top: i === 0 ? 0 : `${i * 18}%`,
                left: 0,
                width: "100%",
              }}
              className={styles.cardDragging}
              isDragging
            />
          ))}
        </div>
      )}

      {/* Auto-complete button */}
      {canAutoComplete() && !won && (
        <button
          className={styles.headerBtn}
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #d4a853, #b8922e)",
            color: "#0a0a14",
            fontWeight: 600,
            padding: "8px 24px",
            fontSize: "0.85rem",
            zIndex: 500,
          }}
          onClick={autoComplete}
        >
          Auto-Complete
        </button>
      )}

      {/* Hint */}
      {showHint && (
        <div className={styles.autoMoveHint}>
          Double-tap a card to auto-move to foundation
        </div>
      )}

      {/* Win Screen */}
      {won && (
        <div className={styles.winOverlay}>
          <div className={styles.winModal}>
            <div className={styles.winTitle}>You Win!</div>
            <div className={styles.winStats}>
              {game.moves} moves &middot; {formatTime(elapsed)}
            </div>
            <button className={styles.winBtn} onClick={newGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
