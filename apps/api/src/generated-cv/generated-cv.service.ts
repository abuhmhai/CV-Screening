import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import PDFDocument from "pdfkit";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGeneratedCvDto, UpdateGeneratedCvDto } from "./dto/generated-cv.dto";

interface CvExperience {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface CvEducation {
  school?: string;
  degree?: string;
  major?: string;
  startYear?: number | string;
  endYear?: number | string;
}

interface CvData {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experiences?: CvExperience[];
  educations?: CvEducation[];
  skills?: Array<{ name?: string; level?: string } | string>;
}

@Injectable()
export class GeneratedCvService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.generatedCv.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }]
    });
  }

  async getOne(userId: string, id: string) {
    const cv = await this.prisma.generatedCv.findUnique({ where: { id } });
    if (!cv || cv.userId !== userId) {
      throw new NotFoundException("CV not found");
    }
    return cv;
  }

  async create(userId: string, dto: CreateGeneratedCvDto) {
    if (dto.isPrimary) {
      await this.prisma.generatedCv.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false }
      });
    }
    return this.prisma.generatedCv.create({
      data: {
        userId,
        title: dto.title,
        templateId: dto.templateId ?? "classic",
        data: dto.data as Prisma.InputJsonValue,
        isPrimary: dto.isPrimary ?? false
      }
    });
  }

  async update(userId: string, id: string, dto: UpdateGeneratedCvDto) {
    await this.getOne(userId, id);
    if (dto.isPrimary) {
      await this.prisma.generatedCv.updateMany({
        where: { userId, isPrimary: true, NOT: { id } },
        data: { isPrimary: false }
      });
    }
    return this.prisma.generatedCv.update({
      where: { id },
      data: {
        title: dto.title,
        templateId: dto.templateId,
        data: dto.data !== undefined ? (dto.data as Prisma.InputJsonValue) : undefined,
        isPrimary: dto.isPrimary
      }
    });
  }

  async remove(userId: string, id: string) {
    await this.getOne(userId, id);
    await this.prisma.generatedCv.delete({ where: { id } });
    return { deleted: true };
  }

  async exportPdf(userId: string, id: string): Promise<Buffer> {
    const cv = await this.getOne(userId, id);
    const data = (cv.data ?? {}) as CvData;
    return this.renderPdf(data);
  }

  private renderPdf(data: CvData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const accent = "#0f766e";

      doc.fillColor(accent).fontSize(24).text(data.fullName ?? "Your Name", { continued: false });
      if (data.headline) {
        doc.moveDown(0.2).fillColor("#111").fontSize(12).text(data.headline);
      }

      const contact = [data.email, data.phone, data.location].filter(Boolean).join("  |  ");
      if (contact) {
        doc.moveDown(0.2).fillColor("#555").fontSize(10).text(contact);
      }

      doc.moveDown(0.6);
      doc
        .strokeColor(accent)
        .lineWidth(1.5)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(0.6);

      if (data.summary) {
        this.sectionTitle(doc, "Summary", accent);
        doc.fillColor("#111").fontSize(10.5).text(data.summary, { lineGap: 2 });
        doc.moveDown(0.6);
      }

      if (data.experiences && data.experiences.length > 0) {
        this.sectionTitle(doc, "Experience", accent);
        for (const exp of data.experiences) {
          doc.fillColor("#111").fontSize(11.5).text(`${exp.position ?? ""}${exp.company ? ` — ${exp.company}` : ""}`, {
            continued: false
          });
          const range = [exp.startDate, exp.endDate ?? "Present"].filter(Boolean).join(" – ");
          if (range) doc.fillColor("#777").fontSize(9.5).text(range);
          if (exp.description) doc.fillColor("#333").fontSize(10).text(exp.description, { lineGap: 1.5 });
          doc.moveDown(0.4);
        }
        doc.moveDown(0.2);
      }

      if (data.educations && data.educations.length > 0) {
        this.sectionTitle(doc, "Education", accent);
        for (const edu of data.educations) {
          doc.fillColor("#111").fontSize(11.5).text(`${edu.degree ?? ""}${edu.major ? `, ${edu.major}` : ""}`);
          const meta = [edu.school, [edu.startYear, edu.endYear].filter(Boolean).join(" – ")]
            .filter(Boolean)
            .join("  |  ");
          if (meta) doc.fillColor("#777").fontSize(9.5).text(meta);
          doc.moveDown(0.4);
        }
        doc.moveDown(0.2);
      }

      if (data.skills && data.skills.length > 0) {
        this.sectionTitle(doc, "Skills", accent);
        const skillText = data.skills
          .map((s) => (typeof s === "string" ? s : `${s.name ?? ""}${s.level ? ` (${s.level})` : ""}`))
          .filter(Boolean)
          .join("  ·  ");
        doc.fillColor("#111").fontSize(10.5).text(skillText, { lineGap: 2 });
      }

      doc.end();
    });
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string, color: string) {
    doc.fillColor(color).fontSize(13).text(title.toUpperCase(), { characterSpacing: 1 });
    doc.moveDown(0.3);
  }
}
