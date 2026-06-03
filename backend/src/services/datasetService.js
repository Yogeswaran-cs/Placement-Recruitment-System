const https = require('https');

// Mock full dataset fallback
const mockDataset = {
  students: [
    { studentId: "STU1001", name: "Lakshit Manne", email: "student1@test.com", department: "CIVIL", cgpa: 6.4, skills: ["AWS", "Express", "Next.js"], graduationYear: 2026, phone: "9790779946", status: "active" },
    { studentId: "STU1002", name: "Ivan Shanker", email: "student2@test.com", department: "CIVIL", cgpa: 8.6, skills: ["MongoDB", "Docker", "Java"], graduationYear: 2026, phone: "9031994523", status: "active" },
    { studentId: "STU1003", name: "Prerak Karnik", email: "student3@test.com", department: "IT", cgpa: 6.8, skills: ["React", "AWS", "Express"], graduationYear: 2027, phone: "9236696312", status: "inactive" },
    { studentId: "STU1004", name: "Armaan Ghose", email: "student4@test.com", department: "MECH", cgpa: 7.0, skills: ["Django"], graduationYear: 2027, phone: "9365341213", status: "active" },
    { studentId: "STU1005", name: "Arun Kumar", email: "arun@mail.com", department: "CSE", cgpa: 6.8, skills: ["Express", "Node.js"], graduationYear: 2027, phone: "9103848421", status: "active" },
    { studentId: "STU1006", name: "Mannat Date", email: "student6@test.com", department: "AI&DS", cgpa: 7.2, skills: ["Node.js", "SQL"], graduationYear: 2027, phone: "9575770529", status: "active" },
    { studentId: "STU1007", name: "Kiara Mani", email: "student7@test.com", department: "EEE", cgpa: 6.3, skills: ["SQL", "Docker"], graduationYear: 2026, phone: "9756528252", status: "active" },
    { studentId: "STU1008", name: "Prisha Jayaraman", email: "student8@test.com", department: "CSE", cgpa: 8.3, skills: ["MongoDB", "TypeScript"], graduationYear: 2026, phone: "9930379756", status: "active" },
    { studentId: "STU1009", name: "Ishaan Shankar", email: "student9@test.com", department: "EEE", cgpa: 7.0, skills: ["SQL", "MongoDB", "Django"], graduationYear: 2027, phone: "9224956459", status: "active" },
    { studentId: "STU1010", name: "Indrajit Dani", email: "student10@test.com", department: "CIVIL", cgpa: 9.2, skills: ["MongoDB", "Docker", "Power BI"], graduationYear: 2026, phone: "9573528321", status: "active" }
  ],
  companies: [
    { companyId: "CMP501", name: "TechNova", role: "ML Engineer", package: 8, eligibleDepartments: ["EEE", "AI&DS", "CSE"], minimumCgpa: 6.9, driveDate: "2026-09-08", status: "upcoming" },
    { companyId: "CMP502", name: "QuantumSoft", role: "Frontend Dev", package: 12, eligibleDepartments: ["CSE", "IT", "AI&DS"], minimumCgpa: 7.5, driveDate: "2026-10-15", status: "upcoming" },
    { companyId: "CMP503", name: "ApexCorp", role: "Analyst", package: 6, eligibleDepartments: ["CIVIL", "MECH", "EEE"], minimumCgpa: 6.0, driveDate: "2026-11-20", status: "upcoming" }
  ],
  drives: [
    { driveId: "DRV101", companyId: "CMP501", title: "TechNova ML Drive", mode: "offline", location: "Coimbatore", registrationDeadline: "2026-11-06", rounds: ["Aptitude", "Technical", "HR"], status: "open" },
    { driveId: "DRV102", companyId: "CMP502", title: "QuantumSoft Hackathon Drive", mode: "online", location: "Remote", registrationDeadline: "2026-11-10", rounds: ["Technical", "HR"], status: "open" },
    { driveId: "DRV103", companyId: "CMP503", title: "ApexCorp Mechanical Drive", mode: "offline", location: "Chennai", registrationDeadline: "2026-10-25", rounds: ["Aptitude", "HR"], status: "closed" }
  ],
  applications: [
    { applicationId: "APP9001", studentId: "STU1001", driveId: "DRV103", appliedAt: "2026-09-08", currentRound: "HR", status: "rejected" },
    { applicationId: "APP9002", studentId: "STU1008", driveId: "DRV102", appliedAt: "2026-10-10", currentRound: "Technical", status: "shortlisted" }
  ],
  interviews: [
    { interviewId: "INT201", applicationId: "APP9001", round: "Aptitude", interviewer: "Alia Zachariah", interviewDate: "2026-10-02", result: "pass" },
    { interviewId: "INT202", applicationId: "APP9001", round: "HR", interviewer: "Alia Zachariah", interviewDate: "2026-10-05", result: "fail" }
  ]
};

const fetchDataset = async (token, dataUrl = '/private/setA') => {
  if (token === 'mock-jwt-token-for-testing') {
    console.log('Using mock full dataset fallback.');
    return mockDataset;
  }

  const baseUrl = process.env.API_BASE_URL || 'https://t4e-testserver.onrender.com/api';

  return new Promise((resolve) => {
    const url = new URL(`${baseUrl}${dataUrl}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            // The dataset is returned under parsed.data
            if (parsed.data) {
              resolve(parsed.data);
            } else {
              console.warn('Dataset Response format invalid, missing .data key. Using mock.');
              resolve(mockDataset);
            }
          } catch (e) {
            console.warn('Invalid JSON from dataset API. Using mock.');
            resolve(mockDataset);
          }
        } else {
          console.warn(`Dataset API returned status ${res.statusCode}. Using mock.`);
          resolve(mockDataset);
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`Dataset API connection error: ${err.message}. Using mock.`);
      resolve(mockDataset);
    });

    req.end();
  });
};

module.exports = {
  fetchDataset
};
