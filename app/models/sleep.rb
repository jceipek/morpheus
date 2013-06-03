class Sleep
  include Mongoid::Document
  field :start, type: Time
  field :end, type: Time
  embedded_in :sleep_data_block
  validates_presence_of :start, :end
end
