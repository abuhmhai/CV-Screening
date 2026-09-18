import { RawJob } from "./crawler.types";

/**
 * Rich seed dataset of realistic IT job postings from TopCV & VietnamWorks.
 * Used as reliable seed / fallback when live crawlers encounter anti-bot or network issues.
 * Covers diverse levels (Intern, Junior, Senior, Lead, Manager), industries, and top tech hubs.
 */
export const SEED_EXTERNAL_JOBS: RawJob[] = [
  {
    source: "topcv",
    title: "Senior Backend Engineer (Node.js/NestJS)",
    company: "FPT Software",
    salary: "40 – 70 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/senior-backend-engineer-nodejs-nestjs-1001.html",
    jd: "Thiết kế và phát triển hệ thống microservices với Node.js, NestJS, PostgreSQL và Redis. Yêu cầu 4+ năm kinh nghiệm backend, thành thạo Docker và CI/CD.",
    skills: ["Node.js", "NestJS", "PostgreSQL", "Redis", "Docker"]
  },
  {
    source: "topcv",
    title: "Frontend Developer (ReactJS/Next.js)",
    company: "MoMo",
    salary: "30 – 55 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/frontend-developer-reactjs-nextjs-1002.html",
    jd: "Xây dựng giao diện người dùng với React, Next.js, TypeScript và Tailwind CSS. Tối ưu hiệu năng và trải nghiệm người dùng cho ứng dụng fintech quy mô lớn.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind", "HTML", "CSS"]
  },
  {
    source: "vietnamworks",
    title: "Data Engineer (Python/Spark)",
    company: "VNG Corporation",
    salary: "Thương lượng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/data-engineer-python-spark-2001-jv",
    jd: "Phát triển data pipeline với Python, Spark và SQL. Kinh nghiệm với AWS, machine learning và xử lý dữ liệu lớn là một lợi thế.",
    skills: ["Python", "SQL", "AWS", "Machine Learning", "Spark"]
  },
  {
    source: "vietnamworks",
    title: "DevOps Engineer (Kubernetes/AWS)",
    company: "Tiki",
    salary: "45 – 75 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/devops-engineer-kubernetes-aws-2002-jv",
    jd: "Vận hành hạ tầng trên AWS với Kubernetes, Terraform và Docker. Thiết lập CI/CD, monitoring và đảm bảo độ tin cậy hệ thống.",
    skills: ["Kubernetes", "AWS", "Docker", "Terraform", "CI/CD"]
  },
  {
    source: "vietnamworks",
    title: "Full-stack Developer (Java/React)",
    company: "Shopee",
    salary: "35 – 60 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/fullstack-developer-java-react-2003-jv",
    jd: "Phát triển sản phẩm end-to-end với Java Spring Boot ở backend và React ở frontend. Làm việc với PostgreSQL, REST API và GraphQL.",
    skills: ["Java", "Spring", "React", "PostgreSQL", "GraphQL", "REST"]
  },
  {
    source: "topcv",
    title: "AI/ML Engineer (Python/PyTorch)",
    company: "Zalo AI",
    salary: "50 – 90 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/ai-ml-engineer-python-pytorch-1003.html",
    jd: "Nghiên cứu và triển khai mô hình machine learning, deep learning và NLP. Thành thạo Python, PyTorch/TensorFlow và sentence-transformers.",
    skills: ["Python", "Machine Learning", "Deep Learning", "NLP", "PyTorch", "TensorFlow"]
  },
  {
    source: "topcv",
    title: "Junior Frontend Developer (Vue.js/TypeScript)",
    company: "VTI Group",
    salary: "15 – 25 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/junior-frontend-developer-vuejs-1004.html",
    jd: "Phát triển giao diện web portal với Vue.js 3, TypeScript và Pinia. Hợp tác chặt chẽ cùng team backend để tích hợp RESTful API.",
    skills: ["Vue.js", "TypeScript", "JavaScript", "HTML", "CSS", "Pinia"]
  },
  {
    source: "vietnamworks",
    title: "Mobile App Developer (Flutter/Dart)",
    company: "Viettel Solutions",
    salary: "25 – 45 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/mobile-app-developer-flutter-dart-2004-jv",
    jd: "Xây dựng và phát triển các ứng dụng di động đa nền tảng bằng Flutter & Dart. Làm việc với Firebase, State Management Bloc/Provider.",
    skills: ["Flutter", "Dart", "Firebase", "REST API", "Git", "Bloc"]
  },
  {
    source: "topcv",
    title: "Senior Mobile Developer (React Native)",
    company: "VNPay",
    salary: "40 – 65 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/senior-mobile-developer-react-native-1005.html",
    jd: "Chịu trách nhiệm kiến trúc và phát triển ứng dụng ví điện tử với React Native. Tối ưu performance, bộ nhớ và animation trên cả iOS & Android.",
    skills: ["React Native", "TypeScript", "Redux", "iOS", "Android", "Performance"]
  },
  {
    source: "vietnamworks",
    title: "Senior QA Automation Engineer (Playwright/Selenium)",
    company: "Axon Vietnam",
    salary: "40 – 60 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/senior-qa-automation-engineer-2005-jv",
    jd: "Thiết kế framework kiểm thử tự động với Playwright, TypeScript và Selenium. Tích hợp test tự động vào pipeline CI/CD GitHub Actions.",
    skills: ["Playwright", "Selenium", "TypeScript", "CI/CD", "Postman", "Automation Testing"]
  },
  {
    source: "topcv",
    title: "Senior Golang Backend Developer",
    company: "One Mount Group",
    salary: "45 – 75 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/senior-golang-backend-developer-1006.html",
    jd: "Xây dựng hệ thống backend hiệu năng cao chịu tải hàng triệu request với Golang, gRPC, Kafka và PostgreSQL.",
    skills: ["Golang", "gRPC", "Kafka", "Microservices", "PostgreSQL", "Docker"]
  },
  {
    source: "topcv",
    title: "Intern Frontend Developer (React/Web)",
    company: "SmartOSC",
    salary: "6 – 10 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/intern-frontend-developer-react-1007.html",
    jd: "Chương trình thực tập sinh Frontend, được đào tạo bài bản về React, HTML5, CSS3, JavaScript ES6 và quy trình làm việc Agile/Scrum.",
    skills: ["JavaScript", "HTML", "CSS", "React", "Git"]
  },
  {
    source: "vietnamworks",
    title: "Intern Backend Developer (Java/Spring)",
    company: "KMS Technology",
    salary: "6 – 10 triệu VNĐ/tháng",
    location: "Đà Nẵng",
    url: "https://www.vietnamworks.com/intern-backend-developer-java-2006-jv",
    jd: "Dành cho sinh viên năm cuối hoặc mới tốt nghiệp ngành CNTT. Tham gia các dự án phát triển phần mềm cho thị trường Bắc Mỹ với Java & Spring.",
    skills: ["Java", "Spring", "SQL", "Git", "REST"]
  },
  {
    source: "vietnamworks",
    title: "Lead Software Architect (Cloud/Microservices)",
    company: "Techcombank",
    salary: "80 – 120 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/lead-software-architect-cloud-2007-jv",
    jd: "Định hình kiến trúc hệ thống Core Banking thế hệ mới. Lãnh đạo kỹ thuật các team phát triển microservices trên nền tảng AWS Cloud.",
    skills: ["Architecture", "AWS", "Microservices", "Java", "Kubernetes", "Leadership"]
  },
  {
    source: "topcv",
    title: "Engineering Manager (Platform/Infra)",
    company: "VNG Games",
    salary: "70 – 110 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/engineering-manager-platform-1008.html",
    jd: "Quản lý và phát triển đội ngũ kỹ sư hạ tầng platform cho các tựa game toàn cầu. Đảm bảo uptime 99.99% và tối ưu chi phí hạ tầng điện toán đám mây.",
    skills: ["Leadership", "Cloud", "Kubernetes", "DevOps", "Agile", "Management"]
  },
  {
    source: "vietnamworks",
    title: "Product Manager (Fintech/Digital Banking)",
    company: "VPBank",
    salary: "50 – 80 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/product-manager-fintech-banking-2008-jv",
    jd: "Chịu trách nhiệm về định hướng sản phẩm số, roadmap tính năng và trải nghiệm người dùng ngân hàng số Omni-Channel.",
    skills: ["Product Management", "Agile", "Scrum", "Data Analytics", "UX/UI"]
  },
  {
    source: "topcv",
    title: "Senior Business Analyst (IT/Banking)",
    company: "MBBank",
    salary: "35 – 55 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/senior-business-analyst-banking-1009.html",
    jd: "Thu thập, phân tích và tài liệu hoá yêu cầu nghiệp vụ ngân hàng số. Phối hợp giữa khối kinh doanh và đội ngũ phát triển công nghệ.",
    skills: ["Business Analysis", "SQL", "UML", "Jira", "Agile", "BPMN"]
  },
  {
    source: "topcv",
    title: "Senior UI/UX Designer (Product Design)",
    company: "MoMo",
    salary: "35 – 55 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/senior-ui-ux-designer-product-1010.html",
    jd: "Thiết kế trải nghiệm người dùng và giao diện cho siêu ứng dụng MoMo. Xây dựng Design System, User Journey Maps và Interactive Prototypes.",
    skills: ["Figma", "UI/UX", "User Research", "Wireframing", "Prototyping", "Design System"]
  },
  {
    source: "vietnamworks",
    title: "Junior Java Backend Developer",
    company: "NashTech Vietnam",
    salary: "18 – 28 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/junior-java-backend-developer-2009-jv",
    jd: "Tham gia phát triển các hệ thống enterprise sử dụng Java 17, Spring Boot và Hibernate. Được mentor trực tiếp bởi các Senior Developers.",
    skills: ["Java", "Spring Boot", "MySQL", "Git", "Hibernate", "OOP"]
  },
  {
    source: "vietnamworks",
    title: "Senior .NET Core Developer (C#/Cloud)",
    company: "ELCA Vietnam",
    salary: "45 – 70 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/senior-net-core-developer-csharp-2010-jv",
    jd: "Phát triển các giải pháp phần mềm chuyên sâu cho thị trường Thuỵ Sĩ với .NET 8, C#, SQL Server, Docker và Azure Cloud.",
    skills: [".NET Core", "C#", "SQL Server", "Docker", "Azure", "Microservices"]
  },
  {
    source: "topcv",
    title: "Senior Cyber Security Engineer (SOC/Infosec)",
    company: "Viettel Cyber Security",
    salary: "40 – 70 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/senior-cyber-security-engineer-1011.html",
    jd: "Giám sát, phát hiện và xử lý sự cố an toàn thông tin (SOC). Triển khai các giải pháp SIEM, EDR và đánh giá lỗ hổng bảo mật.",
    skills: ["Security", "Network", "Linux", "SIEM", "Penetration Testing", "Incident Response"]
  },
  {
    source: "vietnamworks",
    title: "Lead Cloud Solutions Architect (AWS/GCP)",
    company: "NAB Innovation Centre",
    salary: "90 – 130 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/lead-cloud-solutions-architect-2011-jv",
    jd: "Thiết kế kiến trúc hạ tầng Cloud ngân hàng chuẩn quốc tế. Tự động hoá triển khai hạ tầng với Terraform và Kubernetes.",
    skills: ["AWS", "GCP", "Terraform", "Architecture", "Security", "Kubernetes"]
  },
  {
    source: "topcv",
    title: "Junior React Native Developer",
    company: "Gear Inc",
    salary: "16 – 26 triệu VNĐ/tháng",
    location: "Đà Nẵng",
    url: "https://www.topcv.vn/viec-lam/junior-react-native-developer-1012.html",
    jd: "Phát triển các tính năng mobile app mới cho khách hàng quốc tế. Làm việc với React Native, JavaScript/TypeScript và Git.",
    skills: ["React Native", "JavaScript", "TypeScript", "Mobile", "REST API", "Git"]
  },
  {
    source: "vietnamworks",
    title: "Data Analyst (PowerBI/SQL/Python)",
    company: "Shopee",
    salary: "25 – 45 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/data-analyst-powerbi-sql-2012-jv",
    jd: "Phân tích dữ liệu hành vi người dùng thương mại điện tử. Xây dựng dashboard tự động với PowerBI, viết truy vấn SQL phức tạp và mô hình hoá dữ liệu.",
    skills: ["SQL", "Python", "PowerBI", "Data Analysis", "Tableau", "Statistics"]
  },
  {
    source: "topcv",
    title: "Senior Python Backend Engineer (FastAPI/Django)",
    company: "VinAI",
    salary: "45 – 80 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/senior-python-backend-engineer-1013.html",
    jd: "Phát triển backend phục vụ các mô hình AI/LLM quy mô lớn. Tối ưu hoá API latency với FastAPI, Celery, Redis và PostgreSQL.",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "Celery"]
  },
  {
    source: "topcv",
    title: "Technical Lead (Fullstack Node/React)",
    company: "Trusting Social",
    salary: "70 – 100 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/technical-lead-fullstack-node-react-1014.html",
    jd: "Dẫn dắt đội ngũ kỹ sư fullstack phát triển nền tảng chấm điểm tín dụng số. Định hướng công nghệ và trực tiếp review kiến trúc hệ thống.",
    skills: ["Node.js", "React", "TypeScript", "Microservices", "System Design", "Leadership"]
  },
  {
    source: "vietnamworks",
    title: "Junior Manual QA Tester",
    company: "FPT Information System",
    salary: "14 – 22 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/junior-manual-qa-tester-2013-jv",
    jd: "Thực hiện kiểm thử chức năng (Functional testing), hồi quy (Regression testing) cho các hệ thống ERP và chính phủ điện tử.",
    skills: ["Manual Testing", "Test Case", "Jira", "Postman", "SQL", "QA"]
  },
  {
    source: "topcv",
    title: "Senior Android Developer (Kotlin/Jetpack)",
    company: "ZaloPay",
    salary: "40 – 65 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/senior-android-developer-kotlin-1015.html",
    jd: "Phát triển module thanh toán bảo mật cao trên Android. Thành thạo Kotlin, Android Jetpack Compose, Coroutines và Clean Architecture.",
    skills: ["Kotlin", "Android", "Jetpack Compose", "Coroutines", "MVVM", "Clean Architecture"]
  },
  {
    source: "vietnamworks",
    title: "Senior iOS Engineer (Swift/SwiftUI)",
    company: "Tiki",
    salary: "40 – 65 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.vietnamworks.com/senior-ios-engineer-swift-swiftui-2014-jv",
    jd: "Phát triển ứng dụng iOS của Tiki với Swift và SwiftUI. Tối ưu hoá trải nghiệm mua sắm và tốc độ tải trang trên các dòng máy iPhone.",
    skills: ["Swift", "iOS", "SwiftUI", "Combine", "CI/CD", "Xcode"]
  },
  {
    source: "topcv",
    title: "Intern QA / Software Tester",
    company: "TMA Solutions",
    salary: "5 – 8 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/intern-qa-software-tester-1016.html",
    jd: "Dành cho các bạn sinh viên đam mê ngành kiểm thử phần mềm. Được đào tạo viết test case, log bug trên Jira và kiểm thử API cơ bản.",
    skills: ["Testing", "Bug Tracking", "Test Case", "Basic SQL", "Communication"]
  },
  {
    source: "topcv",
    title: "Senior Data Scientist (NLP/LLM)",
    company: "VinBigdata",
    salary: "55 – 95 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.topcv.vn/viec-lam/senior-data-scientist-nlp-llm-1017.html",
    jd: "Nghiên cứu và huấn luyện các mô hình ngôn ngữ lớn (LLMs), RAG pipeline và ứng dụng AI xử lý tiếng Việt chuyên sâu.",
    skills: ["Python", "Machine Learning", "NLP", "LLM", "Deep Learning", "PyTorch", "RAG"]
  },
  {
    source: "vietnamworks",
    title: "Frontend Lead (React/Next.js/Design Systems)",
    company: "One Mount",
    salary: "65 – 95 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/frontend-lead-react-nextjs-2015-jv",
    jd: "Xây dựng và duy trì hệ thống Core UI / Design System dùng chung cho toàn bộ tập đoàn. Định hình tiêu chuẩn code, testing và accessibility.",
    skills: ["React", "Next.js", "TypeScript", "Design System", "Architecture", "Web Performance"]
  },
  {
    source: "topcv",
    title: "DevOps Engineer (GCP/Kubernetes)",
    company: "Be Group",
    salary: "35 – 55 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/devops-engineer-gcp-kubernetes-1018.html",
    jd: "Vận hành hệ thống điều phối chuyến đi thời gian thực trên nền tảng Google Cloud Platform (GCP), GKE và Helm.",
    skills: ["GCP", "Kubernetes", "Docker", "CI/CD", "Monitoring", "Terraform"]
  },
  {
    source: "vietnamworks",
    title: "Full-stack Engineer (Python/Vue.js)",
    company: "Sun* Inc",
    salary: "28 – 45 triệu VNĐ/tháng",
    location: "Đà Nẵng",
    url: "https://www.vietnamworks.com/fullstack-engineer-python-vuejs-2016-jv",
    jd: "Phát triển các sản phẩm startup sáng tạo cho thị trường Nhật Bản với Python Django và Vue.js. Môi trường Agile quốc tế năng động.",
    skills: ["Python", "Vue.js", "Django", "PostgreSQL", "Docker", "REST API"]
  },
  {
    source: "topcv",
    title: "Senior PHP/Laravel Developer",
    company: "Kyanon Digital",
    salary: "30 – 50 triệu VNĐ/tháng",
    location: "TP. Hồ Chí Minh",
    url: "https://www.topcv.vn/viec-lam/senior-php-laravel-developer-1019.html",
    jd: "Xây dựng các giải pháp e-commerce và digital platform quy mô lớn với PHP 8, Laravel, MySQL, Redis và kiến trúc Microservices.",
    skills: ["PHP", "Laravel", "MySQL", "Vue.js", "Redis", "Docker"]
  },
  {
    source: "vietnamworks",
    title: "IT Project Manager (Scrum/Agile)",
    company: "CMC Global",
    salary: "45 – 70 triệu VNĐ/tháng",
    location: "Hà Nội",
    url: "https://www.vietnamworks.com/it-project-manager-scrum-agile-2017-jv",
    jd: "Quản lý tiến độ, nguồn lực và chất lượng các dự án phần mềm outsourcing quy mô lớn cho khách hàng thị trường Châu Á và Châu Âu.",
    skills: ["Project Management", "Scrum", "Agile", "Jira", "Risk Management", "Communication"]
  }
];
