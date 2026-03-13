import type { GlassSurfaceProps } from "../../types";

function GlassSurface({ children, className = '' }: GlassSurfaceProps) {
    return (
        <div className={`glass-surface ${className}`}>
            {children}
        </div>
    );
}

export default GlassSurface;
