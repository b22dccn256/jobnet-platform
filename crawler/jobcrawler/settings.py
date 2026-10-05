BOT_NAME = "jobcrawler"
SPIDER_MODULES = ["jobcrawler.spiders"]
NEWSPIDER_MODULE = "jobcrawler.spiders"

ROBOTSTXT_OBEY = True
DOWNLOAD_DELAY = 2
RANDOMIZE_DOWNLOAD_DELAY = True
CONCURRENT_REQUESTS_PER_DOMAIN = 2
AUTOTHROTTLE_ENABLED = True
USER_AGENT = "JobNetStudentProject (+contact: your-email@example.com)"

ITEM_PIPELINES = {"jobcrawler.pipelines.MongoPipeline": 300}
FEED_EXPORT_ENCODING = "utf-8"
