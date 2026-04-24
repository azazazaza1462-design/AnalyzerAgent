1) Apply folder structure to the project as follows:
   - Lendlogic.AnalyzersApi
	 - Controllers
	 - Models	 
	 - Repositories
	 - Utils
	 - Features

	2) Entities:

	 Jobs
		Id
		CallerID
		JobType: 'CreditAnalysis', 'RiskAssessment', 'FraudDetection'
		JobStatus : Pending, InProgress, Completed, Failed

		MachineID: PODNAME/ MachineName
		StartedAt:
		FinishedAt:

	JobResults
		JobID
		ResultData
		Estatus: Success, Failure     	

	 Caller
		ID
		Name:  'Lendlogic LOS'

	API Endpoints:
		api/v1/file/upload				
				response:
				{
					"fileId": "1534",
					"fileName": "CreditReport.pdf",
					"fileType": "application/pdf",
					"fileSize": 102400,
					"uploadStatus": "Success"
				}

		api/v1/jobs
			POST: Create a new job
				{
					"caller": "Lendlogic LOS",
					"JobType": "CreditReport Analysis",
					"Content: "",
					attachments: [ 1534, 1222, 12312 ]
				}

				{
					BorrowerID: "12345",
					BorrowerName: "John Doe",
					LoanAmount: 50000,
					TargetCreditScore: 700
				}

			response:
				{
					"jobId": "5678"															
				}


