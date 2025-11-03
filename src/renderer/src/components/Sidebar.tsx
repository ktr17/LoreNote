import type { Project } from '../../../types/project';

interface SidebarProps {
  isOpen: boolean;
  projects: Project[];
  currentProject: Project | null;
  onProjectChange: (projectId: string) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  projects,
  currentProject,
  onProjectChange,
  onClose,
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
          transition: 'left 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937',
              margin: 0,
              flex: 1,
            }}
          >
            プロジェクト
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '28px',
              color: '#6b7280',
              padding: '4px 8px',
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px',
              height: '32px',
              borderRadius: '4px',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* Project List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
          }}
        >
          {projects.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              プロジェクトがありません
            </div>
          ) : (
            projects.map((project) => {
              const isActive = currentProject?.id === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectChange(project.id);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    marginBottom: '4px',
                    textAlign: 'left',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    color: isActive ? '#3b82f6' : '#1f2937',
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.name}
                    </span>
                  </div>
                  {project.path && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.path}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
