import type { TemplateId } from "../../store/profile";
import type { TemplateProps } from "./types";
import { ClassicTemplate } from "./ClassicTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { CreativeTemplate } from "./CreativeTemplate";
import { CorporateTemplate } from "./CorporateTemplate";
import { TechMonoTemplate } from "./TechMonoTemplate";

export function RenderTemplate({ id, ...props }: TemplateProps & { id: TemplateId }) {
  switch (id) {
    case "classic":
      return <ClassicTemplate {...props} />;
    case "modern":
      return <ModernTemplate {...props} />;
    case "creative":
      return <CreativeTemplate {...props} />;
    case "corporate":
      return <CorporateTemplate {...props} />;
    case "tech_mono":
      return <TechMonoTemplate {...props} />;
  }
}
