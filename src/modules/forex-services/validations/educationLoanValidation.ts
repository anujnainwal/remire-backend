import * as z from "zod";

export const educationLoanSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  studyCountry: z.string().min(1, "Please select a study country"),
  instituteName: z.string().min(1, "Institute name is required"),
  courseDetails: z.string().min(1, "Course details are required"),
  parentName: z.string().min(1, "Parent name is required"),
  parentMobileNumber: z
    .string()
    .min(10, "Parent mobile number must be at least 10 digits"),
  loanAmount: z.number().positive("Loan amount must be positive").optional(),
  loanPurpose: z.string().optional(),
  documents: z
    .object({
      offerLetter: z.string().optional(),
      passport: z.string().optional(),
      academicTranscripts: z.string().optional(),
      financialDocuments: z.string().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),
});

export default educationLoanSchema;

