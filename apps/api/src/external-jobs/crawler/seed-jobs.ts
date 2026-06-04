import { RawJob } from "./crawler.types";

/**
 * Sample listings when live crawling returns nothing. URLs point to real search pages
 * on TopCV / VietnamWorks (not fake /seed-* detail pages). After a successful crawl,
 * jobs are replaced/added with canonical detail links (-jv / /viec-lam/).
 */
export const SEED_EXTERNAL_JOBS: RawJob[] = [
  {
    source: "topcv",
    title: "Senior Backend Engineer (Node.js/NestJS)",
    company: "FPT Software",
    salary: "40 – 70 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/tim-viec-lam-nodejs.html",
    jd: "Thiết kế và phát triển hệ thống microservices với Node.js, NestJS, PostgreSQL và Redis. Yêu cầu 4+ năm kinh nghiệm backend, thành thạo Docker và CI/CD.",
    skills: ["Node.js", "NestJS", "PostgreSQL", "Redis", "Docker"]
  },
  {
    source: "topcv",
    title: "Frontend Developer (ReactJS/Next.js)",
    company: "MoMo",
    salary: "30 – 55 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/tim-viec-lam-reactjs.html",
    jd: "Xây dựng giao diện người dùng với React, Next.js, TypeScript và Tailwind CSS. Tối ưu hiệu năng và trải nghiệm người dùng cho ứng dụng fintech quy mô lớn.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind", "HTML", "CSS"]
  },
  {
    source: "vietnamworks",
    title: "Data Engineer (Python/Spark)",
    company: "VNG Corporation",
    salary: "Thương lượng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/viec-lam?q=data+engineer",
    jd: "Phát triển data pipeline với Python, Spark và SQL. Kinh nghiệm với AWS, machine learning và xử lý dữ liệu lớn là một lợi thế.",
    skills: ["Python", "SQL", "AWS", "Machine Learning"]
  },
  {
    source: "vietnamworks",
    title: "DevOps Engineer (Kubernetes/AWS)",
    company: "Tiki",
    salary: "45 – 75 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/viec-lam?q=devops",
    jd: "Vận hành hạ tầng trên AWS với Kubernetes, Terraform và Docker. Thiết lập CI/CD, monitoring và đảm bảo độ tin cậy hệ thống.",
    skills: ["Kubernetes", "AWS", "Docker", "Terraform"]
  },
  {
    source: "vietnamworks",
    title: "Full-stack Developer (Java/React)",
    company: "Shopee",
    salary: "35 – 60 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/viec-lam?q=fullstack+java",
    jd: "Phát triển sản phẩm end-to-end với Java Spring Boot ở backend và React ở frontend. Làm việc với PostgreSQL, REST API và GraphQL.",
    skills: ["Java", "Spring", "React", "PostgreSQL", "GraphQL", "REST"]
  },
  {
    source: "topcv",
    title: "AI/ML Engineer (Python)",
    company: "Zalo AI",
    salary: "50 – 90 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/tim-viec-lam-python.html",
    jd: "Nghiên cứu và triển khai mô hình machine learning, deep learning và NLP. Thành thạo Python, PyTorch/TensorFlow và sentence-transformers.",
    skills: ["Python", "Machine Learning", "Deep Learning", "NLP", "PyTorch", "TensorFlow"]
  }
];
