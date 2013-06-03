class SleepDataBlock
  include Mongoid::Document
  belongs_to :user
  embeds_many :sleeps
end
