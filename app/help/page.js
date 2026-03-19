import Link from "next/link";

export const metadata = {
  title: "Solitaire - Help",
  description: "How to play Klondike Solitaire",
};

export default function HelpPage() {
  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Solitaire</h1>
        <p style={subtitleStyle}>Classic Klondike Solitaire</p>

        {/* How to Play */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>How to Play</h2>
          <div style={cardStyle}>
            <h3 style={subheadingStyle}>Objective</h3>
            <p style={textStyle}>
              Move all 52 cards to the four foundation piles, building each
              suit from Ace to King.
            </p>

            <h3 style={{ ...subheadingStyle, marginTop: 16 }}>The Tableau</h3>
            <p style={textStyle}>
              The main playing area consists of seven columns. Cards in the
              tableau are stacked in descending order, alternating between red
              and black suits. For example, a red 6 can be placed on a black 7.
              Only Kings (or stacks beginning with a King) can be placed in
              empty tableau columns.
            </p>

            <h3 style={{ ...subheadingStyle, marginTop: 16 }}>The Stock &amp; Waste</h3>
            <p style={textStyle}>
              Tap the stock pile (top-left) to draw a card to the waste pile.
              The top waste card can be dragged to the tableau or foundations.
              When the stock is empty, tap it again to recycle the waste pile.
            </p>

            <h3 style={{ ...subheadingStyle, marginTop: 16 }}>Foundations</h3>
            <p style={textStyle}>
              The four foundation piles (top-right) are built up by suit from
              Ace to King. Double-tap any top card to automatically send it to
              the correct foundation if a valid move exists.
            </p>

            <h3 style={{ ...subheadingStyle, marginTop: 16 }}>Winning</h3>
            <p style={textStyle}>
              Once all cards are face-up in the tableau, an Auto-Complete button
              appears to finish the game instantly. The game is won when all
              52 cards are on the foundations.
            </p>
          </div>
        </section>

        {/* Tips */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>Tips</h2>
          <div style={cardStyle}>
            <ul style={listStyle}>
              <li style={listItemStyle}>
                Always move Aces and Twos to the foundations as soon as possible.
              </li>
              <li style={listItemStyle}>
                Prioritize uncovering face-down cards in columns with the most
                hidden cards.
              </li>
              <li style={listItemStyle}>
                Keep empty columns for Kings only. Avoid emptying a column
                unless you have a King ready.
              </li>
              <li style={listItemStyle}>
                Use the Undo button freely to explore different move sequences.
              </li>
              <li style={listItemStyle}>
                Double-tap cards to quickly move them to foundations instead of
                dragging.
              </li>
              <li style={listItemStyle}>
                Build tableau stacks evenly. Avoid making one column very long
                while others are empty.
              </li>
            </ul>
          </div>
        </section>

        {/* About */}
        <section style={sectionStyle}>
          <h2 style={headingStyle}>About</h2>
          <div style={cardStyle}>
            <p style={textStyle}>
              This is a modern implementation of Klondike Solitaire, the most
              popular single-player card game. It features drag-and-drop
              controls, undo history, automatic foundation moves, and
              auto-complete.
            </p>
            <p style={{ ...textStyle, marginTop: 8 }}>
              Built with Next.js and React. Designed for both desktop and mobile
              play.
            </p>
          </div>
        </section>

        {/* Back Button */}
        <Link href="/" style={backButtonStyle}>
          Back to Game
        </Link>
      </div>
    </div>
  );
}

/* ─── Styles ─── */

const containerStyle = {
  minHeight: "100dvh",
  background: "#0a0a14",
  color: "#e8e8f0",
  fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
  overflowY: "auto",
  WebkitFontSmoothing: "antialiased",
};

const contentStyle = {
  maxWidth: 560,
  margin: "0 auto",
  padding: "24px 16px 48px",
};

const titleStyle = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: "2rem",
  color: "#d4a853",
  letterSpacing: "0.02em",
  marginBottom: 2,
};

const subtitleStyle = {
  color: "#999",
  fontSize: "0.85rem",
  marginBottom: 28,
};

const sectionStyle = {
  marginBottom: 24,
};

const headingStyle = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: "1.25rem",
  color: "#d4a853",
  marginBottom: 10,
};

const subheadingStyle = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#e8e8f0",
  marginBottom: 4,
};

const cardStyle = {
  background: "#14142a",
  border: "1.5px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
  padding: "16px 18px",
};

const textStyle = {
  fontSize: "0.82rem",
  lineHeight: 1.6,
  color: "#ccc",
};

const listStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const listItemStyle = {
  fontSize: "0.82rem",
  lineHeight: 1.6,
  color: "#ccc",
  paddingLeft: 16,
  position: "relative",
  marginBottom: 8,
};

const backButtonStyle = {
  display: "inline-block",
  marginTop: 12,
  background: "linear-gradient(135deg, #d4a853, #b8922e)",
  color: "#0a0a14",
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 600,
  fontSize: "0.9rem",
  padding: "10px 28px",
  borderRadius: 10,
  textDecoration: "none",
  transition: "transform 0.1s ease",
};
