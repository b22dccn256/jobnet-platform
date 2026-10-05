import scrapy


class ScrapedJobItem(scrapy.Item):
    source = scrapy.Field()
    sourceUrl = scrapy.Field()
    title = scrapy.Field()
    company = scrapy.Field()
    location = scrapy.Field()
    salaryMin = scrapy.Field()
    salaryMax = scrapy.Field()
    skills = scrapy.Field()
    category = scrapy.Field()
    postedAt = scrapy.Field()
