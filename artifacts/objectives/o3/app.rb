# encoding: ASCII-8BIT
#
# Hello Player!
#
# If you've found this..... shhhhhhh, it's the secret behind-the-scenes stuff.
# You don't need it to finish the challenge, but you're welcome to poke around.
#
# The fun part is, you can see how "runtoanswer" is executed! You can't do much
# with it besides complete the challenge... probably. If you do find out more,
# it'd be cool to hear!
#
# I maybe should have created all this as a separate user and ran the server
# with `sudo`, but /shrug. If you find this, enjoy peeking behind the scenes!
#
# As a super special bonus challenge, can you figure out how the iwconfig /
# iwlist tricks work? I'm pretty proud of it! The stuff I did also works for
# NetworkManager / nmcli / wpa_supplicant on a VM, but getting them all working
# together (with dbus) in a container didn't work out, sadly.
#
# Cheers!
# -Ron and Counter Hack

require 'rubygems'

require 'json'
require 'sinatra'
require 'sinatra/base'
require 'tty-markdown'

# These must match the .c file
TRIGGER_FILENAME = "/var/run/letsgo"
EXPECTED_ESSID = "FROST-Nidus-Setup"
EXPECTED_HOSTNAME = "nidus-setup"

# These are also in the .c file
AREA  = "approach"
MIN_X = 31
MAX_X = 42
MIN_Y = 0
MAX_Y = 5

def run2answer()
  return `/bin/runtoanswer 'wowTheyDIDTheThing!'`
end

def md(t)
  return TTY::Markdown.parse(t, mode: 256, width: 80, color: :always)
end

def get_temps()
  begin
    temp = File.read('/var/lib/apiserver/data/temperature').to_f
  rescue
    temp = -40
  end

  begin
    humidity = File.read('/var/lib/apiserver/data/humidity').to_f
  rescue
    humidity = rand(1..100)
  end

  begin
    wind = File.read('/var/lib/apiserver/data/wind').to_f
  rescue
    wind = rand(1..30)
  end

  temp     += rand() * 2.0 - 1.0
  humidity += rand() * 6.0 - 3.0
  wind     += rand() * 6.0 - 3.0

  # Make values sane
  humidity = [0.0, humidity].max
  humidity = [100.0, humidity].min
  wind = [0.0, wind].max

  # Save the values
  File.write('/var/lib/apiserver/data/temperature', temp)
  File.write('/var/lib/apiserver/data/humidity', humidity)
  File.write('/var/lib/apiserver/data/wind', wind)

  # Calculate the windchill
  windchill = 13.12 + (0.6215 * temp) - (11.37 * (wind ** 0.16)) + (0.3965 * temp * (wind ** 0.16))

  temps = {
    'temperature' => temp.round(2),
    'humidity' => humidity.round(2),
    'wind' => wind.round(2),
    'windchill' => windchill.round(2),
  }

  if(temp > 0)
    temps['WARNING'] = "ICE MELT DETECTED!"
    return JSON.pretty_generate(temps) + run2answer() + "\n"
  else
    return JSON.pretty_generate(temps) + "\n"
  end
end

module Api
  class Server < Sinatra::Base
    def initialize(*args)
      super(*args)
    end

    # Make sure we're "online"
    before do
      $stderr.puts "before..."
      begin
        # Check coordinates
        puts ENV.to_a
        if ENV['AREA'] != AREA
          $stderr.puts "bad area"
          throw ''
        end

        location = ENV['LOCATION']
        if location.nil?
          $stderr.puts "bad location"
          throw ''
        end

        x,y = location.split(/,/)
        if x.nil? || y.nil?
          throw ''
        end
        x = x.to_i
        y = y.to_i
        $stderr.puts "#{x},#{y}"
        if x.nil? || y.nil?
          throw ''
        end

        if x < MIN_X || x > MAX_X || y < MIN_Y || y > MAX_Y
          $stderr.puts "bad coords"
          throw ''
        end

        # Check if they're on the wifi
        ap = File.read(TRIGGER_FILENAME)
        if !ap
          throw ''
        end

        if ap != EXPECTED_ESSID
          throw ''
        end

        # Check if they're using the correct host
        if request.host != EXPECTED_HOSTNAME
          throw ''
        end
      rescue
        halt 200, "curl: (6) Could not resolve host: #{ request.host }.\n"
      end

      content_type :json
    end

    configure do
      set :port, 8080
      set :bind, 'localhost'
      set :raise_errors, false
      set :show_exceptions, false
    end

    error do
      return 501, JSON.pretty_generate({ error: "Error: #{ env['sinatra.error'].message }" })
    end

    not_found do
      return 404, JSON.pretty_generate({ error: "Not Found" })
    end

    get '/' do
      return 200, md(erb(:index))
    end

    get '/register' do
      return 200, md(erb(:register))
    end

    get '/apidoc' do
      return 200, md(erb(:apidoc))
    end

    get '/api/cooler' do
      return 200, get_temps()
    end

    post '/api/cooler' do
      payload = JSON.parse(request.body.read)

      if payload['temperature']
        File.write('/var/lib/apiserver/data/temperature', payload['temperature'])
      end

      if payload['humidity']
        File.write('/var/lib/apiserver/data/humidity', payload['humidity'])
      end

      if payload['wind']
        File.write('/var/lib/apiserver/data/wind', payload['wind'])
      end

      return get_temps()
    end

    get /\/api\/.*/ do
      return 200, JSON.pretty_generate({ error: "You must register to use APIs other than /cooler" })
    end
  end
end
