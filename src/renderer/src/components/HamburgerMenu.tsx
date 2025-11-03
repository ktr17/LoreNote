interface HamburgerMenuProps {
  onClick: () => void;
  isOpen: boolean;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="hamburger-menu"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        width: '30px',
        height: '30px',
        zIndex: 1000,
      }}
      aria-label="メニュー"
    >
      <span
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg) translateY(10px)' : 'rotate(0)',
        }}
      />
      <span
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: isOpen ? 0 : 1,
        }}
      />
      <span
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: '#3b82f6',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(-45deg) translateY(-10px)' : 'rotate(0)',
        }}
      />
    </button>
  );
};

export default HamburgerMenu;
